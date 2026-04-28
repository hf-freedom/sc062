package com.ad.system.controller;

import com.ad.system.model.Click;
import com.ad.system.service.FraudDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/fraud")
@CrossOrigin(origins = "*")
public class FraudController {

    @Autowired
    private FraudDetectionService fraudDetectionService;

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runDetection() {
        fraudDetectionService.runFraudDetection();
        
        List<Click> fraudClicks = fraudDetectionService.getFraudClicks();
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("fraudClickCount", fraudClicks.size());
        result.put("message", "作弊检测执行完成");
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/clicks")
    public ResponseEntity<List<Map<String, Object>>> getFraudClicks() {
        List<Click> fraudClicks = fraudDetectionService.getFraudClicks();
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Click click : fraudClicks) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", click.getId());
            item.put("clickId", click.getClickId());
            item.put("planId", click.getPlanId());
            item.put("impressionId", click.getImpressionId());
            item.put("userId", click.getUserId());
            item.put("ip", click.getIp());
            item.put("deviceId", click.getDeviceId());
            item.put("clickTime", click.getClickTime());
            item.put("isFraud", click.getIsFraud());
            item.put("fraudReason", click.getFraudReason());
            item.put("fraudDetectedTime", click.getFraudDetectedTime());
            result.add(item);
        }
        
        return ResponseEntity.ok(result);
    }
}
