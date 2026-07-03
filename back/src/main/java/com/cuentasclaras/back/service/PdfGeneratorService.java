package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.DelinquentMemberDTO;
import com.cuentasclaras.back.dto.ExpenseDetailDTO;
import com.cuentasclaras.back.dto.MonthlyReportDTO;
import com.cuentasclaras.back.dto.PeriodDto;
import com.cuentasclaras.back.dto.PeriodMemberSnapshotDto;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.colors.ColorConstants;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfGeneratorService {

    public byte[] generateMonthlyReportPdf(MonthlyReportDTO report) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Configurar formato de moneda
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.of("es", "AR"));
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.of("es", "AR"));

        // Encabezado
        Paragraph title = new Paragraph("REPORTE MENSUAL - CUENTAS CLARAS")
                .setBold()
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(title);

        Paragraph subtitle = new Paragraph(report.consortiumName())
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(subtitle);

        // Información del reporte
        Paragraph monthInfo = new Paragraph("Mes: " + report.month().format(dateFormatter))
                .setFontSize(12)
                .setMarginBottom(5);
        document.add(monthInfo);

        Paragraph generatedInfo = new Paragraph("Generado: " + report.generatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                .setFontSize(11)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginBottom(20);
        document.add(generatedInfo);

        // Tabla principal de datos
        Table mainTable = new Table(UnitValue.createPercentArray(2))
                .setWidth(UnitValue.createPercentValue(100));

        // Encabezado de tabla
        mainTable.addCell(createHeaderCell("Concepto"));
        mainTable.addCell(createHeaderCell("Monto"));

        // Datos
        mainTable.addCell(createCell("Gastos del mes"));
        mainTable.addCell(createCurrencyCell(currencyFormat.format(report.totalExpenses())));

        mainTable.addCell(createCell("Pagos recibidos"));
        mainTable.addCell(createCurrencyCell(currencyFormat.format(report.totalPayments())));

        mainTable.addCell(createCell("Balance mensual"));
        mainTable.addCell(createCurrencyCell(currencyFormat.format(report.monthlyBalance())));

        document.add(mainTable);

        // Sección de detalle de gastos
        if (report.expenses() != null && !report.expenses().isEmpty()) {
            document.add(new Paragraph("DETALLE DE GASTOS")
                    .setBold().setFontSize(13).setMarginBottom(6).setMarginTop(16));

            Table expTable = new Table(UnitValue.createPercentArray(new float[]{40, 20, 20, 20}))
                    .setWidth(UnitValue.createPercentValue(100));

            expTable.addCell(createHeaderCell("Descripción"));
            expTable.addCell(createHeaderCell("Categoría"));
            expTable.addCell(createHeaderCell("Tipo"));
            expTable.addCell(createHeaderCell("Monto"));

            for (ExpenseDetailDTO e : report.expenses()) {
                expTable.addCell(createCell(e.descripcion()));
                expTable.addCell(createCell(e.categoria() != null ? e.categoria() : "—"));
                expTable.addCell(createCell("FIJO".equals(e.tipoGasto()) ? "Fijo" : "Extraordinario"));
                expTable.addCell(createCurrencyCell(currencyFormat.format(e.monto())));
            }

            document.add(expTable);
        }

        // Sección de detalles de pagos (si los hay)
        if (report.payments() != null && !report.payments().isEmpty()) {
            document.add(new Paragraph("DETALLE DE PAGOS")
                    .setBold().setFontSize(13).setMarginBottom(6).setMarginTop(16));

            Table paymentsTable = new Table(UnitValue.createPercentArray(3))
                    .setWidth(UnitValue.createPercentValue(100));

            paymentsTable.addCell(createHeaderCell("Miembro"));
            paymentsTable.addCell(createHeaderCell("Monto"));
            paymentsTable.addCell(createHeaderCell("Fecha"));

            for (var payment : report.payments()) {
                paymentsTable.addCell(createCell(payment.memberName()));
                paymentsTable.addCell(createCurrencyCell(currencyFormat.format(payment.amount())));
                paymentsTable.addCell(createCell(payment.paymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }

            document.add(paymentsTable);
        }

        // Sección de morosos (si los hay)
        if (!report.delinquentMembers().isEmpty()) {
            document.add(new Paragraph("MIEMBROS MOROSOS")
                    .setBold().setFontSize(13).setMarginBottom(6).setMarginTop(16));

            Table delinquentTable = new Table(UnitValue.createPercentArray(2))
                    .setWidth(UnitValue.createPercentValue(100));

            delinquentTable.addCell(createHeaderCell("Miembro"));
            delinquentTable.addCell(createHeaderCell("Deuda"));

            for (DelinquentMemberDTO member : report.delinquentMembers()) {
                delinquentTable.addCell(createCell(member.memberName()));
                delinquentTable.addCell(createCurrencyCell(currencyFormat.format(member.debt())));
            }

            document.add(delinquentTable);
        }

        // Pie de página
        Paragraph footer = new Paragraph("Este reporte es autogenerado por el sistema de CuentasClaras.")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.GRAY)
                .setMarginTop(20);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generatePeriodReportPdf(PeriodDto period, String consortiumName) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document document = new Document(pdf);

        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.of("es", "AR"));
        String[] MESES = {"", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"};

        document.add(new Paragraph("RESUMEN DE PERÍODO - CUENTAS CLARAS")
                .setBold().setFontSize(20).setTextAlignment(TextAlignment.CENTER).setMarginBottom(10));
        document.add(new Paragraph(consortiumName)
                .setFontSize(14).setTextAlignment(TextAlignment.CENTER).setMarginBottom(5)
                .setFontColor(new com.itextpdf.kernel.colors.DeviceRgb(0, 102, 204)));
        document.add(new Paragraph(MESES[period.mes()] + " " + period.anio())
                .setFontSize(12).setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));
        document.add(new Paragraph(
                "Apertura: " + period.fechaApertura() + "   →   Cierre: " + (period.fechaCierre() != null ? period.fechaCierre() : "—"))
                .setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginBottom(20)
                .setFontColor(ColorConstants.GRAY));

        // Resumen financiero
        Table resumen = new Table(UnitValue.createPercentArray(2)).setWidth(UnitValue.createPercentValue(100));
        resumen.addCell(createHeaderCell("Concepto"));
        resumen.addCell(createHeaderCell("Monto"));
        resumen.addCell(createCell("Gastos del período"));
        resumen.addCell(createCurrencyCell(currencyFormat.format(period.totalGastos())));
        resumen.addCell(createCell("Pagos recibidos"));
        resumen.addCell(createCurrencyCell(currencyFormat.format(period.totalPagos())));
        resumen.addCell(createCell("Fondo al inicio del período"));
        resumen.addCell(createCurrencyCell(currencyFormat.format(period.saldoInicialFondo())));
        resumen.addCell(createCell("Fondo al cierre del período"));
        resumen.addCell(createCurrencyCell(period.saldoFinalFondo() != null
                ? currencyFormat.format(period.saldoFinalFondo()) : "—"));
        document.add(resumen);

        // Detalle de gastos
        if (period.expenses() != null && !period.expenses().isEmpty()) {
            document.add(new Paragraph("DETALLE DE GASTOS")
                    .setBold().setFontSize(13).setMarginTop(16).setMarginBottom(6));

            Table expTable = new Table(UnitValue.createPercentArray(new float[]{40, 20, 20, 20}))
                    .setWidth(UnitValue.createPercentValue(100));
            expTable.addCell(createHeaderCell("Descripción"));
            expTable.addCell(createHeaderCell("Categoría"));
            expTable.addCell(createHeaderCell("Tipo"));
            expTable.addCell(createHeaderCell("Monto"));

            for (ExpenseDetailDTO e : period.expenses()) {
                expTable.addCell(createCell(e.descripcion()));
                expTable.addCell(createCell(e.categoria() != null ? e.categoria() : "—"));
                expTable.addCell(createCell("FIJO".equals(e.tipoGasto()) ? "Fijo" : "Extraordinario"));
                expTable.addCell(createCurrencyCell(currencyFormat.format(e.monto())));
            }
            document.add(expTable);
        }

        // Snapshot de miembros
        if (period.snapshots() != null && !period.snapshots().isEmpty()) {
            document.add(new Paragraph("ESTADO DE CUENTAS AL CIERRE")
                    .setBold().setFontSize(13).setMarginTop(16).setMarginBottom(6));

            Table snapTable = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                    .setWidth(UnitValue.createPercentValue(100));
            snapTable.addCell(createHeaderCell("Miembro"));
            snapTable.addCell(createHeaderCell("Balance al cierre"));

            for (PeriodMemberSnapshotDto s : period.snapshots()) {
                snapTable.addCell(createCell(s.nombreMiembro()));
                com.itextpdf.layout.element.Cell balanceCell = new com.itextpdf.layout.element.Cell()
                        .add(new Paragraph(currencyFormat.format(s.balanceAlCierre())))
                        .setTextAlignment(TextAlignment.RIGHT);
                if (s.balanceAlCierre().compareTo(java.math.BigDecimal.ZERO) < 0) {
                    balanceCell.setFontColor(new com.itextpdf.kernel.colors.DeviceRgb(180, 0, 0));
                } else if (s.balanceAlCierre().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    balanceCell.setFontColor(new com.itextpdf.kernel.colors.DeviceRgb(0, 128, 0));
                }
                snapTable.addCell(balanceCell);
            }
            document.add(snapTable);
        }

        document.add(new Paragraph("Este reporte es autogenerado por el sistema de CuentasClaras.")
                .setFontSize(9).setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.GRAY)
                .setMarginTop(20));

        document.close();
        return baos.toByteArray();
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String content) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(content).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private com.itextpdf.layout.element.Cell createCell(String content) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(content));
    }

    private com.itextpdf.layout.element.Cell createCurrencyCell(String content) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(content))
                .setTextAlignment(TextAlignment.RIGHT);
    }
}
