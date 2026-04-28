package com.ad.system.model;

import com.ad.system.enums.MaterialStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdMaterial {
    private Long id;
    private Long planId;
    private String name;
    private String type;
    private String contentUrl;
    private String title;
    private String description;
    private MaterialStatus status;
    private String reviewComment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
