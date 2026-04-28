package com.ad.system.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DailyReport {
    private Long id;
    private Long advertiserId;
    private Long planId;
    private LocalDate reportDate;
    private Integer impressionCount;
    private Integer clickCount;
    private Integer conversionCount;
    private BigDecimal totalCost;
    private BigDecimal refundAmount;
    private Boolean isSettled;
}
