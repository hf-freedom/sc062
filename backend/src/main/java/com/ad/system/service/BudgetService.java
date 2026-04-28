package com.ad.system.service;

import com.ad.system.enums.PlanStatus;
import com.ad.system.model.AdPlan;
import com.ad.system.model.Advertiser;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class BudgetService {

    @Autowired
    private DataStore dataStore;

    public boolean canServeImpression(Long planId) {
        AdPlan plan = dataStore.getPlans().get(planId);
        if (plan == null) {
            return false;
        }

        Advertiser advertiser = dataStore.getAdvertisers().get(plan.getAdvertiserId());
        if (advertiser == null || !advertiser.getIsActive()) {
            return false;
        }

        if (advertiser.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        BigDecimal advertiserRemainingDaily = advertiser.getDailyBudget().subtract(advertiser.getDailySpent());
        if (advertiserRemainingDaily.compareTo(plan.getBidPrice()) <= 0) {
            return false;
        }

        BigDecimal planRemainingDaily = plan.getDailyBudget().subtract(plan.getDailySpent());
        if (planRemainingDaily.compareTo(plan.getBidPrice()) <= 0) {
            return false;
        }

        BigDecimal planRemainingTotal = plan.getTotalBudget().subtract(plan.getTotalSpent());
        if (planRemainingTotal.compareTo(plan.getBidPrice()) <= 0) {
            return false;
        }

        BigDecimal advertiserRemainingTotal = advertiser.getTotalBudget().subtract(advertiser.getTotalSpent());
        if (advertiserRemainingTotal.compareTo(plan.getBidPrice()) <= 0) {
            return false;
        }

        return true;
    }

    public void deductBudget(Long planId, BigDecimal amount) {
        AdPlan plan = dataStore.getPlans().get(planId);
        if (plan == null) {
            return;
        }

        Advertiser advertiser = dataStore.getAdvertisers().get(plan.getAdvertiserId());
        if (advertiser == null) {
            return;
        }

        advertiser.setBalance(advertiser.getBalance().subtract(amount));
        advertiser.setDailySpent(advertiser.getDailySpent().add(amount));
        advertiser.setTotalSpent(advertiser.getTotalSpent().add(amount));

        plan.setDailySpent(plan.getDailySpent().add(amount));
        plan.setTotalSpent(plan.getTotalSpent().add(amount));

        checkAndPausePlans(advertiser.getId());
    }

    public void refundBudget(Long planId, BigDecimal amount) {
        AdPlan plan = dataStore.getPlans().get(planId);
        if (plan == null) {
            return;
        }

        Advertiser advertiser = dataStore.getAdvertisers().get(plan.getAdvertiserId());
        if (advertiser == null) {
            return;
        }

        advertiser.setBalance(advertiser.getBalance().add(amount));
        advertiser.setDailySpent(advertiser.getDailySpent().subtract(amount));
        advertiser.setTotalSpent(advertiser.getTotalSpent().subtract(amount));

        plan.setDailySpent(plan.getDailySpent().subtract(amount));
        plan.setTotalSpent(plan.getTotalSpent().subtract(amount));
    }

    public void checkAndPausePlans(Long advertiserId) {
        Advertiser advertiser = dataStore.getAdvertisers().get(advertiserId);
        if (advertiser == null) {
            return;
        }

        if (advertiser.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            for (AdPlan plan : dataStore.getPlans().values()) {
                if (plan.getAdvertiserId().equals(advertiserId) && plan.getStatus() == PlanStatus.ACTIVE) {
                    plan.setStatus(PlanStatus.ACCOUNT_ARREARS);
                }
            }
        }
    }

    public void restoreArrearsPlans(Long advertiserId) {
        Advertiser advertiser = dataStore.getAdvertisers().get(advertiserId);
        if (advertiser == null) {
            return;
        }

        if (advertiser.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            for (AdPlan plan : dataStore.getPlans().values()) {
                if (plan.getAdvertiserId().equals(advertiserId) && plan.getStatus() == PlanStatus.ACCOUNT_ARREARS) {
                    plan.setStatus(PlanStatus.ACTIVE);
                }
            }
        }
    }

    public void resetDailyBudgets() {
        for (Advertiser advertiser : dataStore.getAdvertisers().values()) {
            advertiser.setDailySpent(BigDecimal.ZERO);
        }
        for (AdPlan plan : dataStore.getPlans().values()) {
            if (plan.getStatus() == PlanStatus.BUDGET_EXHAUSTED) {
                plan.setStatus(PlanStatus.ACTIVE);
            }
            plan.setDailySpent(BigDecimal.ZERO);
        }
    }
}
