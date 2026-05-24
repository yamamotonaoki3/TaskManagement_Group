package com.taskmanagement.api.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GroupRequest(
        @NotBlank(message = "グループ名を入力してください")
        @Size(max = 50, message = "グループ名は50文字以内で入力してください")
        String name
) {
}
