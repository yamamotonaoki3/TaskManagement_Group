package com.taskmanagement.api.group;

import java.time.LocalDateTime;

public record GroupMemberResponse(
        Long id,
        Long groupId,
        Long userId,
        String email,
        String nickname,
        LocalDateTime joinedAt
) {
}
