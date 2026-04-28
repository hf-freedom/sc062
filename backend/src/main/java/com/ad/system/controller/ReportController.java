package com.ad.system.controller;

import com.ad.system.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> getDailySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(reportService.getDailySummary(date));
    }

    @GetMapping("/plan/{planId}/daily")
    public ResponseEntity<List<Map<String, Object>>> getPlanDailySummary(
            @PathVariable Long planId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(reportService.getPlanDailySummary(planId, date));
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalanceSummary() {
        return ResponseEntity.ok(reportService.getAccountBalanceSummary());
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateDailyReport(
            @RequestParam(required = false) Long advertiserId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        
        com.ad.system.model.DailyReport report = reportService.generateDailyReport(advertiserId, planId, date);
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("report", report);
        result.put("message", "报表生成成功");
        
        return ResponseEntity.ok(result);
    }
}
