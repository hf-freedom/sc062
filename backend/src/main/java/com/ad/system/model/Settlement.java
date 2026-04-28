package com.ad.system.model;

import com.ad.system.enums.SettlementStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Settlement {
    private Long id;
    private String settlementNo;
    private Long advertiserId;
    private LocalDate settlementDate;
    private Integer impressionCount;
    private Integer clickCount;
    private Integer conversionCount;
    private BigDecimal totalCost;
    private BigDecimal refundAmount;
    private BigDecimal finalAmount;
    private SettlementStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime settledAt;
}
