package com.ad.system.controller;

import com.ad.system.enums.MaterialStatus;
import com.ad.system.model.AdMaterial;
import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin(origins = "*")
public class MaterialController {

    @Autowired
    private DataStore dataStore;

    @GetMapping
    public ResponseEntity<List<AdMaterial>> list() {
        return ResponseEntity.ok(new ArrayList<>(dataStore.getMaterials().values()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdMaterial> getById(@PathVariable Long id) {
        AdMaterial material = dataStore.getMaterials().get(id);
        if (material == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(material);
    }

    @PostMapping
    public ResponseEntity<AdMaterial> create(@RequestBody AdMaterial material) {
        material.setId(dataStore.nextMaterialId());
        material.setStatus(MaterialStatus.DRAFT);
        material.setCreatedAt(LocalDateTime.now());
        material.setUpdatedAt(LocalDateTime.now());
        dataStore.getMaterials().put(material.getId(), material);
        dataStore.getMaterialsByPlanId()
                .computeIfAbsent(material.getPlanId(), k -> new ArrayList<>())
                .add(material);
        return ResponseEntity.ok(material);
    }

    @PostMapping("/{id}/submit-review")
    public ResponseEntity<AdMaterial> submitReview(@PathVariable Long id) {
        AdMaterial material = dataStore.getMaterials().get(id);
        if (material == null) {
            return ResponseEntity.notFound().build();
        }
        if (material.getStatus() == MaterialStatus.DRAFT) {
            material.setStatus(MaterialStatus.PENDING_REVIEW);
            material.setUpdatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(material);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AdMaterial> approve(@PathVariable Long id, @RequestParam(required = false) String comment) {
        AdMaterial material = dataStore.getMaterials().get(id);
        if (material == null) {
            return ResponseEntity.notFound().build();
        }
        if (material.getStatus() == MaterialStatus.PENDING_REVIEW) {
            material.setStatus(MaterialStatus.APPROVED);
            material.setReviewComment(comment);
            material.setUpdatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(material);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AdMaterial> reject(@PathVariable Long id, @RequestParam String reason) {
        AdMaterial material = dataStore.getMaterials().get(id);
        if (material == null) {
            return ResponseEntity.notFound().build();
        }
        if (material.getStatus() == MaterialStatus.PENDING_REVIEW) {
            material.setStatus(MaterialStatus.REJECTED);
            material.setReviewComment(reason);
            material.setUpdatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(material);
    }

    @GetMapping("/plan/{planId}")
    public ResponseEntity<List<AdMaterial>> getByPlan(@PathVariable Long planId) {
        List<AdMaterial> materials = dataStore.getMaterialsByPlanId().get(planId);
        return ResponseEntity.ok(materials != null ? materials : new ArrayList<>());
    }
}
