package com.ad.system.service;

import com.ad.system.model.Click;
import com.ad.system.model.Impression;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FraudDetectionService {

    @Autowired
    private DataStore dataStore;

    @Autowired
    private BudgetService budgetService;

    private static final int MAX_CLICKS_PER_IP = 10;
    private static final int MAX_CLICKS_PER_DEVICE = 10;
    private static final int MIN_CLICK_INTERVAL_SECONDS = 1;
    private static final int TIME_WINDOW_MINUTES = 60;

    @Scheduled(fixedRate = 30000)
    public void runFraudDetection() {
        LocalDateTime startTime = LocalDateTime.now().minusMinutes(TIME_WINDOW_MINUTES);
        List<Click> recentClicks = dataStore.getClicks().values().stream()
                .filter(click -> click.getClickTime().isAfter(startTime))
                .filter(click -> !Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());

        detectSameIpClicks(recentClicks);
        detectSameDeviceClicks(recentClicks);
        detectClickFrequencyClicks(recentClicks);
        detectImpressionWithoutClick(recentClicks);
    }

    private void detectSameIpClicks(List<Click> clicks) {
        Map<String, List<Click>> clicksByIp = clicks.stream()
                .collect(Collectors.groupingBy(Click::getIp));

        for (Map.Entry<String, List<Click>> entry : clicksByIp.entrySet()) {
            if (entry.getValue().size() > MAX_CLICKS_PER_IP) {
                markAsFraud(entry.getValue(), "同一IP点击次数异常: " + entry.getValue().size() + " 次");
            }
        }
    }

    private void detectSameDeviceClicks(List<Click> clicks) {
        Map<String, List<Click>> clicksByDevice = clicks.stream()
                .filter(c -> c.getDeviceId() != null)
                .collect(Collectors.groupingBy(Click::getDeviceId));

        for (Map.Entry<String, List<Click>> entry : clicksByDevice.entrySet()) {
            if (entry.getValue().size() > MAX_CLICKS_PER_DEVICE) {
                markAsFraud(entry.getValue(), "同一设备点击次数异常: " + entry.getValue().size() + " 次");
            }
        }
    }

    private void detectClickFrequencyClicks(List<Click> clicks) {
        Map<String, List<Click>> clicksByUserId = clicks.stream()
                .filter(c -> c.getUserId() != null)
                .collect(Collectors.groupingBy(Click::getUserId));

        for (Map.Entry<String, List<Click>> entry : clicksByUserId.entrySet()) {
            List<Click> userClicks = entry.getValue();
            if (userClicks.size() < 2) {
                continue;
            }

            userClicks.sort(Comparator.comparing(Click::getClickTime));
            for (int i = 1; i < userClicks.size(); i++) {
                Duration interval = Duration.between(userClicks.get(i - 1).getClickTime(), userClicks.get(i).getClickTime());
                if (interval.getSeconds() < MIN_CLICK_INTERVAL_SECONDS) {
                    markAsFraud(Arrays.asList(userClicks.get(i - 1), userClicks.get(i)),
                            "点击频率异常，间隔: " + interval.getSeconds() + " 秒");
                }
            }
        }
    }

    private void detectImpressionWithoutClick(List<Click> clicks) {
        Set<Long> clickImpressionIds = clicks.stream()
                .map(Click::getImpressionId)
                .collect(Collectors.toSet());

        for (Click click : clicks) {
            Impression impression = dataStore.getImpressions().get(click.getImpressionId());
            if (impression == null) {
                markAsFraud(Collections.singletonList(click), "点击对应的曝光记录不存在");
            }
        }
    }

    private void markAsFraud(List<Click> clicks, String reason) {
        LocalDateTime now = LocalDateTime.now();
        for (Click click : clicks) {
            if (Boolean.TRUE.equals(click.getIsFraud())) {
                continue;
            }

            click.setIsFraud(true);
            click.setFraudReason(reason);
            click.setFraudDetectedTime(now);

            Impression impression = dataStore.getImpressions().get(click.getImpressionId());
            if (impression != null && Boolean.TRUE.equals(impression.getIsCharged())) {
                budgetService.refundBudget(impression.getPlanId(), impression.getActualCost());
            }
        }
    }

    public List<Click> getFraudClicks() {
        return dataStore.getClicks().values().stream()
                .filter(click -> Boolean.TRUE.equals(click.getIsFraud()))
                .collect(Collectors.toList());
    }
}
