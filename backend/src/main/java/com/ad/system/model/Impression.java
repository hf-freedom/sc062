package com.ad.system.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Impression {
    private Long id;
    private String requestId;
    private Long planId;
    private Long materialId;
    private Long advertiserId;
    private String userId;
    private String deviceId;
    private String ip;
    private String userAgent;
    private BigDecimal bidPrice;
    private BigDecimal actualCost;
    private LocalDateTime impressionTime;
    private Boolean isCharged;
    private String location;
    private String gender;
    private Integer age;
}
