package com.ad.system.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Click {
    private Long id;
    private String clickId;
    private Long impressionId;
    private Long planId;
    private Long materialId;
    private Long advertiserId;
    private String userId;
    private String deviceId;
    private String ip;
    private LocalDateTime clickTime;
    private Boolean isFraud;
    private String fraudReason;
    private LocalDateTime fraudDetectedTime;
}
