package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.MonthlyReportDTO;
import com.cuentasclaras.back.dto.PeriodDto;
import com.cuentasclaras.back.service.ConsortiumService;
import com.cuentasclaras.back.service.PeriodService;
import com.cuentasclaras.back.service.ReportService;
import com.cuentasclaras.back.service.PdfGeneratorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.YearMonth;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final PdfGeneratorService pdfGeneratorService;
    private final PeriodService periodService;
    private final ConsortiumService consortiumService;

    public ReportController(ReportService reportService, PdfGeneratorService pdfGeneratorService,
                            PeriodService periodService, ConsortiumService consortiumService) {
        this.reportService = reportService;
        this.pdfGeneratorService = pdfGeneratorService;
        this.periodService = periodService;
        this.consortiumService = consortiumService;
    }

    /**
     * GET /api/reports/monthly/{consortiumId}
     * Descarga el reporte mensual en PDF
     *
     * @param consortiumId ID del consorcio
     * @param year Año (ej: 2026)
     * @param month Mes (ej: 6 para junio)
     * @return PDF descargable
     */
    @GetMapping("/monthly/{consortiumId}")
    public ResponseEntity<byte[]> downloadMonthlyReport(
            @PathVariable Long consortiumId,
            @RequestParam(name = "year") int year,
            @RequestParam(name = "month") int month) throws IOException {

        YearMonth yearMonth = YearMonth.of(year, month);
        MonthlyReportDTO report = reportService.generateMonthlyReport(consortiumId, yearMonth);
        byte[] pdf = pdfGeneratorService.generateMonthlyReportPdf(report);

        String filename = String.format("reporte-%d-%02d.pdf", year, month);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /**
     * GET /api/reports/monthly/{consortiumId}/preview
     * Obtiene los datos del reporte sin descargar PDF (para vista previa)
     *
     * @param consortiumId ID del consorcio
     * @param year Año
     * @param month Mes
     * @return Datos del reporte en JSON
     */
    @GetMapping("/monthly/{consortiumId}/preview")
    public ResponseEntity<MonthlyReportDTO> previewMonthlyReport(
            @PathVariable Long consortiumId,
            @RequestParam(name = "year") int year,
            @RequestParam(name = "month") int month) {

        YearMonth yearMonth = YearMonth.of(year, month);
        MonthlyReportDTO report = reportService.generateMonthlyReport(consortiumId, yearMonth);

        return ResponseEntity.ok(report);
    }

    /** GET /api/reports/period/{periodId} — PDF de un período cerrado */
    @GetMapping("/period/{periodId}")
    public ResponseEntity<byte[]> downloadPeriodReport(@PathVariable Long periodId) throws IOException {
        PeriodDto period = periodService.getPeriodDetailById(periodId);
        String consortiumName = consortiumService.getById(period.consortiumId()).name();
        byte[] pdf = pdfGeneratorService.generatePeriodReportPdf(period, consortiumName);

        String filename = String.format("periodo-%02d-%d.pdf", period.mes(), period.anio());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
