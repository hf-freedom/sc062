package com.ad.system.controller;

import com.ad.system.model.Advertiser;
import com.ad.system.service.BudgetService;
import com.ad.system.service.ReportService;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/advertisers")
@CrossOrigin(origins = "*")
public class AdvertiserController {

    @Autowired
    private DataStore dataStore;

    @Autowired
    private ReportService reportService;

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<Advertiser>> list() {
        return ResponseEntity.ok(new ArrayList<>(dataStore.getAdvertisers().values()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Advertiser> getById(@PathVariable Long id) {
        Advertiser advertiser = dataStore.getAdvertisers().get(id);
        if (advertiser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(advertiser);
    }

    @PostMapping
    public ResponseEntity<Advertiser> create(@RequestBody Advertiser advertiser) {
        advertiser.setId(dataStore.nextAdvertiserId());
        advertiser.setDailySpent(BigDecimal.ZERO);
        advertiser.setTotalSpent(BigDecimal.ZERO);
        advertiser.setIsActive(true);
        advertiser.setCreatedAt(LocalDateTime.now());
        advertiser.setUpdatedAt(LocalDateTime.now());
        dataStore.getAdvertisers().put(advertiser.getId(), advertiser);
        return ResponseEntity.ok(advertiser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Advertiser> update(@PathVariable Long id, @RequestBody Advertiser advertiser) {
        Advertiser existing = dataStore.getAdvertisers().get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (advertiser.getName() != null) existing.setName(advertiser.getName());
        if (advertiser.getBalance() != null) existing.setBalance(advertiser.getBalance());
        if (advertiser.getTotalBudget() != null) existing.setTotalBudget(advertiser.getTotalBudget());
        if (advertiser.getDailyBudget() != null) existing.setDailyBudget(advertiser.getDailyBudget());
        if (advertiser.getIsActive() != null) existing.setIsActive(advertiser.getIsActive());
        existing.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(existing);
    }

    @GetMapping("/balance-summary")
    public ResponseEntity<Map<String, Object>> getBalanceSummary() {
        return ResponseEntity.ok(reportService.getAccountBalanceSummary());
    }

    @PostMapping("/{id}/recharge")
    public ResponseEntity<Advertiser> recharge(@PathVariable Long id, @RequestParam BigDecimal amount) {
        Advertiser advertiser = dataStore.getAdvertisers().get(id);
        if (advertiser == null) {
            return ResponseEntity.notFound().build();
        }
        advertiser.setBalance(advertiser.getBalance().add(amount));
        advertiser.setUpdatedAt(LocalDateTime.now());
        budgetService.restoreArrearsPlans(id);
        return ResponseEntity.ok(advertiser);
    }
}
