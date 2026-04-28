package com.ad.system.controller;

import com.ad.system.model.Adjustment;
import com.ad.system.model.Settlement;
import com.ad.system.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/settlements")
@CrossOrigin(origins = "*")
public class SettlementController {

    @Autowired
    private SettlementService settlementService;

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runSettlement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now().minusDays(1);
        }
        
        settlementService.settleAllAdvertisers(date);
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("settlementDate", date.toString());
        result.put("message", "结算执行成功");
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/advertiser/{advertiserId}")
    public ResponseEntity<Map<String, Object>> createSettlement(
            @PathVariable Long advertiserId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now().minusDays(1);
        }
        
        Settlement settlement = settlementService.createSettlement(advertiserId, date);
        
        Map<String, Object> result = new LinkedHashMap<>();
        if (settlement != null) {
            result.put("success", true);
            result.put("settlement", settlement);
            result.put("message", "结算创建成功");
        } else {
            result.put("success", false);
            result.put("message", "广告主不存在");
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.confirmSettlement(id);
        
        Map<String, Object> result = new LinkedHashMap<>();
        if (settlement != null) {
            result.put("success", true);
            result.put("settlement", settlement);
            result.put("message", "结算确认成功");
        } else {
            result.put("success", false);
            result.put("message", "结算单不存在或状态不正确");
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/advertiser/{advertiserId}")
    public ResponseEntity<List<Settlement>> getSettlementsByAdvertiser(@PathVariable Long advertiserId) {
        return ResponseEntity.ok(settlementService.getSettlementsByAdvertiser(advertiserId));
    }

    @PostMapping("/{settlementId}/adjustments")
    public ResponseEntity<Map<String, Object>> createAdjustment(
            @PathVariable Long settlementId,
            @RequestBody Map<String, Object> request) {
        String reason = (String) request.get("reason");
        Object amountObj = request.get("adjustmentAmount");
        BigDecimal adjustmentAmount = amountObj != null 
            ? new BigDecimal(amountObj.toString()) 
            : BigDecimal.ZERO;
        String operator = (String) request.getOrDefault("operator", "SYSTEM");
        
        Adjustment adjustment = settlementService.createAdjustment(settlementId, reason, adjustmentAmount, operator);
        
        Map<String, Object> result = new LinkedHashMap<>();
        if (adjustment != null) {
            result.put("success", true);
            result.put("adjustment", adjustment);
            result.put("message", "调整单创建成功，已结算报表已通过调整单修改");
        } else {
            result.put("success", false);
            result.put("message", "结算单不存在或状态不正确（需要已结算状态）");
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{settlementId}/adjustments")
    public ResponseEntity<List<Adjustment>> getAdjustmentsBySettlement(@PathVariable Long settlementId) {
        return ResponseEntity.ok(settlementService.getAdjustmentsBySettlement(settlementId));
    }
}
