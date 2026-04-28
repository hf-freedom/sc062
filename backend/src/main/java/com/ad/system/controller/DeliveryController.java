package com.ad.system.controller;

import com.ad.system.model.AdPlan;
import com.ad.system.model.Click;
import com.ad.system.model.Conversion;
import com.ad.system.model.Impression;
import com.ad.system.service.AdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/delivery")
@CrossOrigin(origins = "*")
public class DeliveryController {

    @Autowired
    private AdService adService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestAd(@RequestBody Map<String, Object> request) {
        String gender = (String) request.get("gender");
        Integer age = request.get("age") != null ? ((Number) request.get("age")).intValue() : null;
        String region = (String) request.get("region");
        @SuppressWarnings("unchecked")
        List<String> interests = (List<String>) request.get("interests");
        String userId = (String) request.get("userId");
        String deviceId = (String) request.get("deviceId");
        String ip = (String) request.get("ip");
        String userAgent = (String) request.get("userAgent");

        Optional<AdPlan> planOpt = adService.selectPlanForUser(gender, age, region, interests);

        Map<String, Object> result = new LinkedHashMap<>();
        if (planOpt.isPresent()) {
            AdPlan plan = planOpt.get();
            String requestId = UUID.randomUUID().toString();

            Impression impression = adService.recordImpression(
                    plan.getId(), requestId, userId, deviceId, ip, userAgent,
                    region, gender, age
            );

            if (impression != null) {
                result.put("success", true);
                result.put("requestId", requestId);
                result.put("planId", plan.getId());
                result.put("planName", plan.getName());
                result.put("materialId", impression.getMaterialId());
                result.put("bidPrice", plan.getBidPrice());
                result.put("message", "广告投放成功");
            } else {
                result.put("success", false);
                result.put("message", "广告记录失败");
            }
        } else {
            result.put("success", false);
            result.put("message", "没有匹配的广告");
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/click")
    public ResponseEntity<Map<String, Object>> recordClick(@RequestBody Map<String, Object> request) {
        String requestId = (String) request.get("requestId");
        String userId = (String) request.get("userId");
        String deviceId = (String) request.get("deviceId");
        String ip = (String) request.get("ip");

        Click click = adService.recordClick(requestId, userId, deviceId, ip);

        Map<String, Object> result = new LinkedHashMap<>();
        if (click != null) {
            result.put("success", true);
            result.put("clickId", click.getClickId());
            result.put("planId", click.getPlanId());
            result.put("message", "点击记录成功");
        } else {
            result.put("success", false);
            result.put("message", "未找到对应的曝光记录");
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/convert")
    public ResponseEntity<Map<String, Object>> recordConversion(@RequestBody Map<String, Object> request) {
        String clickId = (String) request.get("clickId");
        String conversionType = (String) request.getOrDefault("conversionType", "PURCHASE");
        Object valueObj = request.get("conversionValue");
        java.math.BigDecimal conversionValue = valueObj != null 
            ? new java.math.BigDecimal(valueObj.toString()) 
            : java.math.BigDecimal.ZERO;

        Conversion conversion = adService.recordConversion(clickId, conversionType, conversionValue);

        Map<String, Object> result = new LinkedHashMap<>();
        if (conversion != null) {
            result.put("success", true);
            result.put("conversionId", conversion.getConversionId());
            result.put("planId", conversion.getPlanId());
            result.put("message", "转化记录成功");
        } else {
            result.put("success", false);
            result.put("message", "未找到对应的点击记录或点击已被标记为作弊");
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/convert/backfill")
    public ResponseEntity<Map<String, Object>> recordBackfillConversion(@RequestBody Map<String, Object> request) {
        String clickId = (String) request.get("clickId");
        String conversionType = (String) request.getOrDefault("conversionType", "PURCHASE");
        Object valueObj = request.get("conversionValue");
        java.math.BigDecimal conversionValue = valueObj != null 
            ? new java.math.BigDecimal(valueObj.toString()) 
            : java.math.BigDecimal.ZERO;
        
        Object timeObj = request.get("conversionTime");
        LocalDateTime conversionTime = LocalDateTime.now().minusDays(1);
        
        if (timeObj != null) {
            String timeStr = timeObj.toString();
            try {
                Instant instant = Instant.parse(timeStr);
                conversionTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            } catch (DateTimeParseException e) {
                try {
                    conversionTime = LocalDateTime.parse(timeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException e2) {
                    conversionTime = LocalDateTime.now().minusDays(1);
                }
            }
        }

        Conversion conversion = adService.recordBackfillConversion(clickId, conversionType, conversionValue, conversionTime);

        Map<String, Object> result = new LinkedHashMap<>();
        if (conversion != null) {
            result.put("success", true);
            result.put("conversionId", conversion.getConversionId());
            result.put("planId", conversion.getPlanId());
            result.put("isBackfilled", true);
            result.put("message", "延迟转化回写成功");
        } else {
            result.put("success", false);
            result.put("message", "未找到对应的点击记录或点击已被标记为作弊");
        }

        return ResponseEntity.ok(result);
    }
}
