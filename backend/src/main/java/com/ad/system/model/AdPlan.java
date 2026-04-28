package com.ad.system.model;

import com.ad.system.enums.PlanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdPlan {
    private Long id;
    private Long advertiserId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal bidPrice;
    private BigDecimal dailyBudget;
    private BigDecimal totalBudget;
    private BigDecimal dailySpent;
    private BigDecimal totalSpent;
    private List<String> targetGenders;
    private List<Integer> targetAgeRanges;
    private List<String> targetRegions;
    private List<String> targetInterests;
    private PlanStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
