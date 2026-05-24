package com.taskmanagement.api.group;

import jakarta.validation.Valid;
import java.nio.file.AccessDeniedException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupResponse create(@RequestBody @Valid GroupRequest req) {
        return groupService.create(req);
    }

    @GetMapping
    public List<GroupResponse> getMyGroups() {
        return groupService.findMyGroups();
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> getMembers(@PathVariable Long groupId)
            throws AccessDeniedException {
        return groupService.findMembers(groupId);
    }

    @PostMapping("/{groupId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public GroupMemberResponse invite(@PathVariable Long groupId,
                                      @RequestBody @Valid InviteMemberRequest req)
            throws AccessDeniedException {
        return groupService.inviteMember(groupId, req);
    }
}
