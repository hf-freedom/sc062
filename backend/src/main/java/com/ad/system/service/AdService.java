package com.ad.system.service;

import com.ad.system.enums.MaterialStatus;
import com.ad.system.enums.PlanStatus;
import com.ad.system.model.*;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdService {

    @Autowired
    private DataStore dataStore;

    @Autowired
    private BudgetService budgetService;

    public Optional<AdPlan> selectPlanForUser(String gender, Integer age, String region, List<String> interests) {
        List<AdPlan> activePlans = dataStore.getPlans().values().stream()
                .filter(plan -> plan.getStatus() == PlanStatus.ACTIVE)
                .filter(plan -> budgetService.canServeImpression(plan.getId()))
                .filter(plan -> matchesTargeting(plan, gender, age, region, interests))
                .filter(plan -> hasApprovedMaterial(plan.getId()))
                .collect(Collectors.toList());

        if (activePlans.isEmpty()) {
            return Optional.empty();
        }

        activePlans.sort((a, b) -> b.getBidPrice().compareTo(a.getBidPrice()));
        return Optional.of(activePlans.get(0));
    }

    private boolean matchesTargeting(AdPlan plan, String gender, Integer age, String region, List<String> interests) {
        if (plan.getTargetGenders() != null && !plan.getTargetGenders().isEmpty() && gender != null) {
            if (!plan.getTargetGenders().contains(gender)) {
                return false;
            }
        }

        if (plan.getTargetAgeRanges() != null && !plan.getTargetAgeRanges().isEmpty() && age != null) {
            boolean ageMatch = false;
            for (int i = 0; i < plan.getTargetAgeRanges().size(); i++) {
                int minAge = plan.getTargetAgeRanges().get(i);
                int maxAge = (i + 1 < plan.getTargetAgeRanges().size()) ? plan.getTargetAgeRanges().get(i + 1) : 100;
                if (age >= minAge && age < maxAge) {
                    ageMatch = true;
                    break;
                }
            }
            if (!ageMatch) {
                return false;
            }
        }

        if (plan.getTargetRegions() != null && !plan.getTargetRegions().isEmpty() && region != null) {
            if (!plan.getTargetRegions().contains(region)) {
                return false;
            }
        }

        if (plan.getTargetInterests() != null && !plan.getTargetInterests().isEmpty() && interests != null && !interests.isEmpty()) {
            boolean hasCommonInterest = false;
            for (String interest : interests) {
                if (plan.getTargetInterests().contains(interest)) {
                    hasCommonInterest = true;
                    break;
                }
            }
            if (!hasCommonInterest) {
                return false;
            }
        }

        return true;
    }

    private boolean hasApprovedMaterial(Long planId) {
        List<AdMaterial> materials = dataStore.getMaterialsByPlanId().get(planId);
        if (materials == null || materials.isEmpty()) {
            return false;
        }
        return materials.stream().anyMatch(m -> m.getStatus() == MaterialStatus.APPROVED);
    }

    public Impression recordImpression(Long planId, String requestId, String userId, String deviceId,
                                        String ip, String userAgent, String location, String gender, Integer age) {
        AdPlan plan = dataStore.getPlans().get(planId);
        if (plan == null) {
            return null;
        }

        List<AdMaterial> materials = dataStore.getMaterialsByPlanId().get(planId);
        if (materials == null || materials.isEmpty()) {
            return null;
        }

        AdMaterial approvedMaterial = materials.stream()
                .filter(m -> m.getStatus() == MaterialStatus.APPROVED)
                .findFirst()
                .orElse(null);
        if (approvedMaterial == null) {
            return null;
        }

        Impression impression = new Impression();
        impression.setId(dataStore.nextImpressionId());
        impression.setRequestId(requestId);
        impression.setPlanId(planId);
        impression.setMaterialId(approvedMaterial.getId());
        impression.setAdvertiserId(plan.getAdvertiserId());
        impression.setUserId(userId);
        impression.setDeviceId(deviceId);
        impression.setIp(ip);
        impression.setUserAgent(userAgent);
        impression.setBidPrice(plan.getBidPrice());
        impression.setActualCost(plan.getBidPrice());
        impression.setImpressionTime(LocalDateTime.now());
        impression.setIsCharged(true);
        impression.setLocation(location);
        impression.setGender(gender);
        impression.setAge(age);

        dataStore.getImpressions().put(impression.getId(), impression);
        dataStore.getImpressionsByRequestId().put(requestId, impression);

        budgetService.deductBudget(planId, plan.getBidPrice());

        return impression;
    }

    public Click recordClick(String requestId, String userId, String deviceId, String ip) {
        Impression impression = dataStore.getImpressionsByRequestId().get(requestId);
        if (impression == null) {
            return null;
        }

        Click click = new Click();
        click.setId(dataStore.nextClickId());
        click.setClickId(UUID.randomUUID().toString());
        click.setImpressionId(impression.getId());
        click.setPlanId(impression.getPlanId());
        click.setMaterialId(impression.getMaterialId());
        click.setAdvertiserId(impression.getAdvertiserId());
        click.setUserId(userId);
        click.setDeviceId(deviceId);
        click.setIp(ip);
        click.setClickTime(LocalDateTime.now());
        click.setIsFraud(false);

        dataStore.getClicks().put(click.getId(), click);

        return click;
    }

    public Conversion recordConversion(String clickId, String conversionType, BigDecimal conversionValue) {
        Click click = dataStore.getClicks().values().stream()
                .filter(c -> c.getClickId().equals(clickId))
                .findFirst()
                .orElse(null);

        if (click == null || Boolean.TRUE.equals(click.getIsFraud())) {
            return null;
        }

        Impression impression = dataStore.getImpressions().get(click.getImpressionId());
        if (impression == null) {
            return null;
        }

        Conversion conversion = new Conversion();
        conversion.setId(dataStore.nextConversionId());
        conversion.setConversionId(UUID.randomUUID().toString());
        conversion.setClickId(click.getId());
        conversion.setImpressionId(impression.getId());
        conversion.setPlanId(impression.getPlanId());
        conversion.setMaterialId(impression.getMaterialId());
        conversion.setAdvertiserId(impression.getAdvertiserId());
        conversion.setUserId(click.getUserId());
        conversion.setConversionType(conversionType);
        conversion.setConversionValue(conversionValue);
        conversion.setConversionTime(LocalDateTime.now());
        conversion.setReportedTime(LocalDateTime.now());
        conversion.setIsBackfilled(false);

        dataStore.getConversions().put(conversion.getId(), conversion);

        return conversion;
    }

    public Conversion recordBackfillConversion(String clickId, String conversionType, BigDecimal conversionValue,
                                                LocalDateTime conversionTime) {
        Click click = dataStore.getClicks().values().stream()
                .filter(c -> c.getClickId().equals(clickId))
                .findFirst()
                .orElse(null);

        if (click == null || Boolean.TRUE.equals(click.getIsFraud())) {
            return null;
        }

        Impression impression = dataStore.getImpressions().get(click.getImpressionId());
        if (impression == null) {
            return null;
        }

        Conversion conversion = new Conversion();
        conversion.setId(dataStore.nextConversionId());
        conversion.setConversionId(UUID.randomUUID().toString());
        conversion.setClickId(click.getId());
        conversion.setImpressionId(impression.getId());
        conversion.setPlanId(impression.getPlanId());
        conversion.setMaterialId(impression.getMaterialId());
        conversion.setAdvertiserId(impression.getAdvertiserId());
        conversion.setUserId(click.getUserId());
        conversion.setConversionType(conversionType);
        conversion.setConversionValue(conversionValue);
        conversion.setConversionTime(conversionTime);
        conversion.setReportedTime(LocalDateTime.now());
        conversion.setIsBackfilled(true);

        dataStore.getConversions().put(conversion.getId(), conversion);

        return conversion;
    }
}
