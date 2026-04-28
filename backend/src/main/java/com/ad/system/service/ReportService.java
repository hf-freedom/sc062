package com.ad.system.service;

import com.ad.system.model.*;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private DataStore dataStore;

    public Map<String, Object> getDailySummary(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Impression> impressions = dataStore.getImpressions().values().stream()
                .filter(imp -> imp.getImpressionTime().isAfter(startOfDay)
                        && imp.getImpressionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> clicks = dataStore.getClicks().values().stream()
                .filter(click -> click.getClickTime().isAfter(startOfDay)
                        && click.getClickTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Conversion> conversions = dataStore.getConversions().values().stream()
                .filter(conv -> conv.getConversionTime().isAfter(startOfDay)
                        && conv.getConversionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> fraudClicks = clicks.stream()
                .filter(click -> Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());

        int totalImpressions = impressions.size();
        int totalClicks = clicks.size();
        int totalConversions = conversions.size();
        int fraudClickCount = fraudClicks.size();
        int validClicks = totalClicks - fraudClickCount;

        BigDecimal totalCost = impressions.stream()
                .map(Impression::getActualCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundAmount = fraudClicks.stream()
                .map(click -> {
                    Impression imp = dataStore.getImpressions().get(click.getImpressionId());
                    return imp != null ? imp.getActualCost() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ctr = totalImpressions > 0
                ? BigDecimal.valueOf(validClicks).divide(BigDecimal.valueOf(totalImpressions), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal cvr = validClicks > 0
                ? BigDecimal.valueOf(totalConversions).divide(BigDecimal.valueOf(validClicks), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("date", date.toString());
        summary.put("totalImpressions", totalImpressions);
        summary.put("totalClicks", totalClicks);
        summary.put("validClicks", validClicks);
        summary.put("fraudClicks", fraudClickCount);
        summary.put("totalConversions", totalConversions);
        summary.put("totalCost", totalCost);
        summary.put("refundAmount", refundAmount);
        summary.put("netCost", totalCost.subtract(refundAmount));
        summary.put("ctr", ctr.setScale(2, RoundingMode.HALF_UP) + "%");
        summary.put("cvr", cvr.setScale(2, RoundingMode.HALF_UP) + "%");

        return summary;
    }

    public List<Map<String, Object>> getPlanDailySummary(Long planId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Impression> impressions = dataStore.getImpressions().values().stream()
                .filter(imp -> planId.equals(imp.getPlanId()))
                .filter(imp -> imp.getImpressionTime().isAfter(startOfDay)
                        && imp.getImpressionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> clicks = dataStore.getClicks().values().stream()
                .filter(click -> planId.equals(click.getPlanId()))
                .filter(click -> click.getClickTime().isAfter(startOfDay)
                        && click.getClickTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Conversion> conversions = dataStore.getConversions().values().stream()
                .filter(conv -> planId.equals(conv.getPlanId()))
                .filter(conv -> conv.getConversionTime().isAfter(startOfDay)
                        && conv.getConversionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> fraudClicks = clicks.stream()
                .filter(click -> Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());

        int totalImpressions = impressions.size();
        int totalClicks = clicks.size();
        int totalConversions = conversions.size();
        int fraudClickCount = fraudClicks.size();
        int validClicks = totalClicks - fraudClickCount;

        BigDecimal totalCost = impressions.stream()
                .map(Impression::getActualCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundAmount = fraudClicks.stream()
                .map(click -> {
                    Impression imp = dataStore.getImpressions().get(click.getImpressionId());
                    return imp != null ? imp.getActualCost() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("planId", planId);
        summary.put("date", date.toString());
        summary.put("impressions", totalImpressions);
        summary.put("clicks", totalClicks);
        summary.put("validClicks", validClicks);
        summary.put("fraudClicks", fraudClickCount);
        summary.put("conversions", totalConversions);
        summary.put("cost", totalCost);
        summary.put("refund", refundAmount);
        summary.put("netCost", totalCost.subtract(refundAmount));

        if (totalImpressions > 0) {
            BigDecimal ctr = BigDecimal.valueOf(validClicks).divide(BigDecimal.valueOf(totalImpressions), 4, RoundingMode.HALF_UP);
            summary.put("ctr", ctr.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) + "%");
        } else {
            summary.put("ctr", "0.00%");
        }

        if (validClicks > 0) {
            BigDecimal cvr = BigDecimal.valueOf(totalConversions).divide(BigDecimal.valueOf(validClicks), 4, RoundingMode.HALF_UP);
            summary.put("cvr", cvr.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) + "%");
        } else {
            summary.put("cvr", "0.00%");
        }

        return Collections.singletonList(summary);
    }

    public Map<String, Object> getAccountBalanceSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();

        List<Map<String, Object>> advertisers = new ArrayList<>();
        for (Advertiser advertiser : dataStore.getAdvertisers().values()) {
            Map<String, Object> adSummary = new LinkedHashMap<>();
            adSummary.put("advertiserId", advertiser.getId());
            adSummary.put("name", advertiser.getName());
            adSummary.put("balance", advertiser.getBalance());
            adSummary.put("totalBudget", advertiser.getTotalBudget());
            adSummary.put("dailyBudget", advertiser.getDailyBudget());
            adSummary.put("totalSpent", advertiser.getTotalSpent());
            adSummary.put("dailySpent", advertiser.getDailySpent());
            adSummary.put("isActive", advertiser.getIsActive());
            advertisers.add(adSummary);
        }

        summary.put("advertisers", advertisers);

        BigDecimal totalBalance = dataStore.getAdvertisers().values().stream()
                .map(Advertiser::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpent = dataStore.getAdvertisers().values().stream()
                .map(Advertiser::getTotalSpent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("totalPlatformBalance", totalBalance);
        summary.put("totalPlatformSpent", totalSpent);

        return summary;
    }

    public DailyReport generateDailyReport(Long advertiserId, Long planId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Impression> impressions = dataStore.getImpressions().values().stream()
                .filter(imp -> advertiserId == null || advertiserId.equals(imp.getAdvertiserId()))
                .filter(imp -> planId == null || planId.equals(imp.getPlanId()))
                .filter(imp -> imp.getImpressionTime().isAfter(startOfDay)
                        && imp.getImpressionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> clicks = dataStore.getClicks().values().stream()
                .filter(click -> advertiserId == null || advertiserId.equals(click.getAdvertiserId()))
                .filter(click -> planId == null || planId.equals(click.getPlanId()))
                .filter(click -> click.getClickTime().isAfter(startOfDay)
                        && click.getClickTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Conversion> conversions = dataStore.getConversions().values().stream()
                .filter(conv -> advertiserId == null || advertiserId.equals(conv.getAdvertiserId()))
                .filter(conv -> planId == null || planId.equals(conv.getPlanId()))
                .filter(conv -> conv.getConversionTime().isAfter(startOfDay)
                        && conv.getConversionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> fraudClicks = clicks.stream()
                .filter(click -> Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());

        DailyReport report = new DailyReport();
        report.setId(dataStore.nextReportId());
        report.setAdvertiserId(advertiserId);
        report.setPlanId(planId);
        report.setReportDate(date);
        report.setImpressionCount(impressions.size());
        report.setClickCount(clicks.size() - fraudClicks.size());
        report.setConversionCount(conversions.size());
        report.setTotalCost(impressions.stream().map(Impression::getActualCost).reduce(BigDecimal.ZERO, BigDecimal::add));
        report.setRefundAmount(fraudClicks.stream()
                .map(click -> {
                    Impression imp = dataStore.getImpressions().get(click.getImpressionId());
                    return imp != null ? imp.getActualCost() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        report.setIsSettled(false);

        dataStore.getDailyReports().put(report.getId(), report);

        return report;
    }
}
