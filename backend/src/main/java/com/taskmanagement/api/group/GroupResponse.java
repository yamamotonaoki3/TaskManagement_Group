package com.taskmanagement.api.group;

import java.time.LocalDateTime;

public record GroupResponse(
        Long id,
        String name,
        Long ownerUserId,
        LocalDateTime createdAt
) {
    static GroupResponse from(Group group) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                group.getOwnerUserId(),
                group.getCreatedAt()
        );
    }
}
