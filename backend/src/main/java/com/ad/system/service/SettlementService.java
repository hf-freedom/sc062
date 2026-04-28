package com.ad.system.service;

import com.ad.system.enums.SettlementStatus;
import com.ad.system.model.*;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    @Autowired
    private DataStore dataStore;

    @Autowired
    private ReportService reportService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void runDailySettlement() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        settleAllAdvertisers(yesterday);
    }

    public void settleAllAdvertisers(LocalDate date) {
        for (Advertiser advertiser : dataStore.getAdvertisers().values()) {
            createSettlement(advertiser.getId(), date);
        }
    }

    public Settlement createSettlement(Long advertiserId, LocalDate date) {
        Advertiser advertiser = dataStore.getAdvertisers().get(advertiserId);
        if (advertiser == null) {
            return null;
        }

        Settlement existing = dataStore.getSettlements().values().stream()
                .filter(s -> advertiserId.equals(s.getAdvertiserId()))
                .filter(s -> date.equals(s.getSettlementDate()))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            return existing;
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Impression> impressions = dataStore.getImpressions().values().stream()
                .filter(imp -> advertiserId.equals(imp.getAdvertiserId()))
                .filter(imp -> imp.getImpressionTime().isAfter(startOfDay)
                        && imp.getImpressionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> clicks = dataStore.getClicks().values().stream()
                .filter(click -> advertiserId.equals(click.getAdvertiserId()))
                .filter(click -> click.getClickTime().isAfter(startOfDay)
                        && click.getClickTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Conversion> conversions = dataStore.getConversions().values().stream()
                .filter(conv -> advertiserId.equals(conv.getAdvertiserId()))
                .filter(conv -> conv.getConversionTime().isAfter(startOfDay)
                        && conv.getConversionTime().isBefore(endOfDay))
                .collect(Collectors.toList());

        List<Click> fraudClicks = clicks.stream()
                .filter(click -> Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());

        int validClickCount = clicks.size() - fraudClicks.size();

        BigDecimal totalCost = impressions.stream()
                .map(Impression::getActualCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundAmount = fraudClicks.stream()
                .map(click -> {
                    Impression imp = dataStore.getImpressions().get(click.getImpressionId());
                    return imp != null ? imp.getActualCost() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Settlement settlement = new Settlement();
        settlement.setId(dataStore.nextSettlementId());
        settlement.setSettlementNo("SETTLE_" + date.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        settlement.setAdvertiserId(advertiserId);
        settlement.setSettlementDate(date);
        settlement.setImpressionCount(impressions.size());
        settlement.setClickCount(validClickCount);
        settlement.setConversionCount(conversions.size());
        settlement.setTotalCost(totalCost);
        settlement.setRefundAmount(refundAmount);
        settlement.setFinalAmount(totalCost.subtract(refundAmount));
        settlement.setStatus(SettlementStatus.PENDING);
        settlement.setCreatedAt(LocalDateTime.now());

        dataStore.getSettlements().put(settlement.getId(), settlement);

        for (DailyReport report : dataStore.getDailyReports().values()) {
            if (advertiserId.equals(report.getAdvertiserId()) && date.equals(report.getReportDate())) {
                report.setIsSettled(true);
            }
        }

        return settlement;
    }

    public Settlement confirmSettlement(Long settlementId) {
        Settlement settlement = dataStore.getSettlements().get(settlementId);
        if (settlement == null) {
            return null;
        }

        if (settlement.getStatus() != SettlementStatus.PENDING) {
            return settlement;
        }

        settlement.setStatus(SettlementStatus.SETTLED);
        settlement.setSettledAt(LocalDateTime.now());

        return settlement;
    }

    public Adjustment createAdjustment(Long settlementId, String reason, BigDecimal adjustmentAmount, String operator) {
        Settlement settlement = dataStore.getSettlements().get(settlementId);
        if (settlement == null) {
            return null;
        }

        if (settlement.getStatus() == SettlementStatus.PENDING) {
            return null;
        }

        Adjustment adjustment = new Adjustment();
        adjustment.setId(dataStore.nextAdjustmentId());
        adjustment.setAdjustmentNo("ADJ_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        adjustment.setSettlementId(settlementId);
        adjustment.setAdvertiserId(settlement.getAdvertiserId());
        adjustment.setAdjustmentDate(LocalDate.now());
        adjustment.setReason(reason);
        adjustment.setAdjustmentAmount(adjustmentAmount);
        adjustment.setOperator(operator);
        adjustment.setCreatedAt(LocalDateTime.now());

        dataStore.getAdjustments().put(adjustment.getId(), adjustment);

        Advertiser advertiser = dataStore.getAdvertisers().get(settlement.getAdvertiserId());
        if (advertiser != null) {
            advertiser.setBalance(advertiser.getBalance().add(adjustmentAmount));
        }

        settlement.setStatus(SettlementStatus.ADJUSTED);

        return adjustment;
    }

    public List<Settlement> getSettlementsByAdvertiser(Long advertiserId) {
        return dataStore.getSettlements().values().stream()
                .filter(s -> advertiserId.equals(s.getAdvertiserId()))
                .collect(Collectors.toList());
    }

    public List<Adjustment> getAdjustmentsBySettlement(Long settlementId) {
        return dataStore.getAdjustments().values().stream()
                .filter(a -> settlementId.equals(a.getSettlementId()))
                .collect(Collectors.toList());
    }
}
