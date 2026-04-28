package com.ad.system.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Adjustment {
    private Long id;
    private String adjustmentNo;
    private Long settlementId;
    private Long advertiserId;
    private LocalDate adjustmentDate;
    private String reason;
    private BigDecimal adjustmentAmount;
    private String operator;
    private LocalDateTime createdAt;
}
