package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.ComprobanteDto;
import com.cuentasclaras.back.entity.Comprobante;
import com.cuentasclaras.back.entity.ComprobanteStatus;
import com.cuentasclaras.back.entity.Consortium;
import com.cuentasclaras.back.entity.ConsortiumRole;
import com.cuentasclaras.back.entity.FundMovement;
import com.cuentasclaras.back.entity.FundMovementType;
import com.cuentasclaras.back.entity.Payment;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.ComprobanteRepository;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.FundMovementRepository;
import com.cuentasclaras.back.repository.PaymentRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ComprobanteService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "application/pdf"
    );
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final Path uploadRoot;

    private final ComprobanteRepository comprobanteRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ConsortiumMemberRepository memberRepository;
    private final FundMovementRepository fundMovementRepository;

    public ComprobanteService(
            @Value("${app.upload-dir:./uploads/comprobantes}") String uploadDir,
            ComprobanteRepository comprobanteRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            ConsortiumMemberRepository memberRepository,
            FundMovementRepository fundMovementRepository) throws IOException {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadRoot);
        this.comprobanteRepository = comprobanteRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.fundMovementRepository = fundMovementRepository;
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    @Transactional
    public ComprobanteDto upload(Long paymentId, MultipartFile file, String callerEmail) {
        validateFile(file);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado: " + paymentId));

        User caller = getUser(callerEmail);

        // El que sube debe ser miembro del consorcio del pago
        Long consortiumId = payment.getConsortium().getId();
        boolean isMember = memberRepository.existsByConsortiumIdAndUserId(consortiumId, caller.getId());
        if (!isMember) {
            throw new ForbiddenException("No pertenecés a este grupo");
        }

        // Solo el dueño del pago puede subir su comprobante
        if (!payment.getUser().getId().equals(caller.getId())) {
            throw new ForbiddenException("Solo podés subir el comprobante de tus propios pagos");
        }

        // Un pago ya aprobado no puede reemplazarse
        if (payment.getComprobante() != null
                && payment.getComprobante().getStatus() == ComprobanteStatus.APROBADO) {
            throw new IllegalStateException("El comprobante ya fue aprobado y no puede reemplazarse");
        }

        // Si ya existe (y está RECHAZADO o PENDIENTE) eliminamos el archivo anterior
        if (payment.getComprobante() != null) {
            deleteFile(payment.getComprobante().getFilePath());
            comprobanteRepository.delete(payment.getComprobante());
        }

        String filePath = storeFile(file, consortiumId);

        Comprobante comprobante = new Comprobante(
                payment, caller,
                sanitizeFilename(file.getOriginalFilename()),
                file.getContentType(),
                file.getSize(),
                filePath
        );
        comprobanteRepository.save(comprobante);
        payment.setComprobante(comprobante);

        return toDto(comprobante);
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    @Transactional
    public ComprobanteDto approve(Long comprobanteId, String callerEmail) {
        Comprobante comprobante = getComprobante(comprobanteId);
        User admin = getUser(callerEmail);
        Payment payment = comprobante.getPayment();
        Consortium consortium = payment.getConsortium();
        requireAdmin(admin, consortium.getId());

        if (comprobante.getStatus() != ComprobanteStatus.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden aprobar comprobantes en estado PENDIENTE");
        }

        comprobante.approve(admin);

        // Acreditar el pago al fondo y actualizar el balance del miembro
        FundMovement ingreso = new FundMovement(
                consortium,
                FundMovementType.INGRESO,
                "Pago validado — " + payment.getUser().getNombre(),
                payment.getMonto(),
                payment.getUser(),
                payment.getFechaPago()
        );
        fundMovementRepository.save(ingreso);

        memberRepository
                .findByConsortiumIdAndUserId(consortium.getId(), payment.getUser().getId())
                .ifPresent(member -> {
                    member.setBalance(member.getBalance().add(payment.getMonto()));
                    memberRepository.save(member);
                });

        return toDto(comprobante);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @Transactional
    public ComprobanteDto reject(Long comprobanteId, String motivo, String callerEmail) {
        Comprobante comprobante = getComprobante(comprobanteId);
        User admin = getUser(callerEmail);
        requireAdmin(admin, comprobante.getPayment().getConsortium().getId());

        if (comprobante.getStatus() != ComprobanteStatus.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden rechazar comprobantes en estado PENDIENTE");
        }

        comprobante.reject(admin, motivo);
        return toDto(comprobante);
    }

    // ── Serve file ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Resource getFile(Long comprobanteId, String callerEmail) {
        Comprobante comprobante = getComprobante(comprobanteId);
        User caller = getUser(callerEmail);
        Long consortiumId = comprobante.getPayment().getConsortium().getId();

        boolean isMember = memberRepository.existsByConsortiumIdAndUserId(consortiumId, caller.getId());
        if (!isMember) {
            throw new ForbiddenException("No tenés acceso a este comprobante");
        }

        try {
            Path filePath = uploadRoot.resolve(comprobante.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new IllegalStateException("Archivo no encontrado en el servidor");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Error al leer el archivo", e);
        }
    }

    // ── List pending (admin) ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ComprobanteDto> getPendientes(Long consortiumId, String callerEmail) {
        User caller = getUser(callerEmail);
        requireAdmin(caller, consortiumId);
        return comprobanteRepository
                .findByConsortiumIdAndStatus(consortiumId, ComprobanteStatus.PENDIENTE)
                .stream().map(this::toDto).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Se aceptan: PDF, JPEG, PNG");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo de 10 MB");
        }
    }

    private String storeFile(MultipartFile file, Long consortiumId) {
        String ext = getExtension(file.getOriginalFilename());
        String relativePath = "consortium-" + consortiumId + "/" + UUID.randomUUID() + ext;
        Path destination = uploadRoot.resolve(relativePath).normalize();

        if (!destination.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Ruta de archivo inválida");
        }

        try {
            Files.createDirectories(destination.getParent());
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Error al guardar el archivo", e);
        }
        return relativePath;
    }

    private void deleteFile(String relativePath) {
        try {
            Path target = uploadRoot.resolve(relativePath).normalize();
            if (target.startsWith(uploadRoot)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ignored) {}
    }

    private Comprobante getComprobante(Long id) {
        return comprobanteRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private void requireAdmin(User user, Long consortiumId) {
        boolean isAdmin = memberRepository.existsByConsortiumIdAndUserIdAndRole(
                consortiumId, user.getId(), ConsortiumRole.ADMIN);
        if (!isAdmin) {
            throw new ForbiddenException("Solo el administrador puede realizar esta acción");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "archivo";
        return filename.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }

    public ComprobanteDto toDto(Comprobante c) {
        return new ComprobanteDto(
                String.valueOf(c.getId()),
                String.valueOf(c.getPayment().getId()),
                c.getUploadedBy().getNombre(),
                c.getFileName(),
                c.getFileType(),
                c.getFileSize(),
                c.getStatus().name(),
                c.getReviewedBy() != null ? c.getReviewedBy().getNombre() : null,
                c.getRejectionReason(),
                c.getUploadedAt().toString(),
                c.getReviewedAt() != null ? c.getReviewedAt().toString() : null
        );
    }
}
