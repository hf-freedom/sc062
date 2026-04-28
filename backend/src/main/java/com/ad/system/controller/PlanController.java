package com.ad.system.controller;

import com.ad.system.enums.PlanStatus;
import com.ad.system.model.AdPlan;
import com.ad.system.service.BudgetService;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
@CrossOrigin(origins = "*")
public class PlanController {

    @Autowired
    private DataStore dataStore;

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<AdPlan>> list() {
        return ResponseEntity.ok(new ArrayList<>(dataStore.getPlans().values()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdPlan> getById(@PathVariable Long id) {
        AdPlan plan = dataStore.getPlans().get(id);
        if (plan == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(plan);
    }

    @PostMapping
    public ResponseEntity<AdPlan> create(@RequestBody AdPlan plan) {
        plan.setId(dataStore.nextPlanId());
        plan.setDailySpent(BigDecimal.ZERO);
        plan.setTotalSpent(BigDecimal.ZERO);
        plan.setStatus(PlanStatus.DRAFT);
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        dataStore.getPlans().put(plan.getId(), plan);
        dataStore.getPlansByAdvertiserId()
                .computeIfAbsent(plan.getAdvertiserId(), k -> new ArrayList<>())
                .add(plan);
        return ResponseEntity.ok(plan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdPlan> update(@PathVariable Long id, @RequestBody AdPlan plan) {
        AdPlan existing = dataStore.getPlans().get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (plan.getName() != null) existing.setName(plan.getName());
        if (plan.getStartDate() != null) existing.setStartDate(plan.getStartDate());
        if (plan.getEndDate() != null) existing.setEndDate(plan.getEndDate());
        if (plan.getBidPrice() != null) existing.setBidPrice(plan.getBidPrice());
        if (plan.getDailyBudget() != null) existing.setDailyBudget(plan.getDailyBudget());
        if (plan.getTotalBudget() != null) existing.setTotalBudget(plan.getTotalBudget());
        if (plan.getTargetGenders() != null) existing.setTargetGenders(plan.getTargetGenders());
        if (plan.getTargetAgeRanges() != null) existing.setTargetAgeRanges(plan.getTargetAgeRanges());
        if (plan.getTargetRegions() != null) existing.setTargetRegions(plan.getTargetRegions());
        if (plan.getTargetInterests() != null) existing.setTargetInterests(plan.getTargetInterests());
        existing.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(existing);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<AdPlan> start(@PathVariable Long id) {
        AdPlan plan = dataStore.getPlans().get(id);
        if (plan == null) {
            return ResponseEntity.notFound().build();
        }
        if (plan.getStatus() == PlanStatus.DRAFT || plan.getStatus() == PlanStatus.PAUSED) {
            plan.setStatus(PlanStatus.ACTIVE);
            plan.setUpdatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<AdPlan> pause(@PathVariable Long id) {
        AdPlan plan = dataStore.getPlans().get(id);
        if (plan == null) {
            return ResponseEntity.notFound().build();
        }
        if (plan.getStatus() == PlanStatus.ACTIVE) {
            plan.setStatus(PlanStatus.PAUSED);
            plan.setUpdatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/advertiser/{advertiserId}")
    public ResponseEntity<List<AdPlan>> getByAdvertiser(@PathVariable Long advertiserId) {
        List<AdPlan> plans = dataStore.getPlansByAdvertiserId().get(advertiserId);
        return ResponseEntity.ok(plans != null ? plans : new ArrayList<>());
    }
}
