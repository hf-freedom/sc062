package com.ad.system.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Conversion {
    private Long id;
    private String conversionId;
    private Long clickId;
    private Long impressionId;
    private Long planId;
    private Long materialId;
    private Long advertiserId;
    private String userId;
    private String conversionType;
    private BigDecimal conversionValue;
    private LocalDateTime conversionTime;
    private LocalDateTime reportedTime;
    private Boolean isBackfilled;
}
