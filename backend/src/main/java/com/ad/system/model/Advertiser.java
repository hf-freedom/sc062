package com.ad.system.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Advertiser {
    private Long id;
    private String name;
    private BigDecimal balance;
    private BigDecimal totalBudget;
    private BigDecimal dailyBudget;
    private BigDecimal dailySpent;
    private BigDecimal totalSpent;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
