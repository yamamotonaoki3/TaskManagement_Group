package com.taskmanagement.api.group;

import com.taskmanagement.api.list.TaskList;
import com.taskmanagement.api.list.TaskListRepository;
import com.taskmanagement.api.list.TaskListService;
import com.taskmanagement.api.task.TaskRepository;
import com.taskmanagement.api.user.User;
import com.taskmanagement.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final TaskListService taskListService;
    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;

    public GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            TaskListService taskListService,
            TaskListRepository taskListRepository,
            TaskRepository taskRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.taskListService = taskListService;
        this.taskListRepository = taskListRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public GroupResponse create(GroupRequest req) {
        User me = currentUser();
        Group group = new Group();
        group.setName(req.name());
        group.setOwnerUserId(me.getId());
        group.setCreatedAt(LocalDateTime.now());
        Group saved = groupRepository.save(group);
        taskListService.createDefaultListsForGroup(saved.getId());

        GroupMember owner = new GroupMember();
        owner.setGroupId(saved.getId());
        owner.setUserId(me.getId());
        owner.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(owner);

        return GroupResponse.from(saved);
    }

    public List<GroupResponse> findMyGroups() {
        User me = currentUser();
        return groupRepository.findAllByMember(me.getId()).stream()
                .map(GroupResponse::from)
                .toList();
    }

    public Group findById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("グループが見つかりません: " + groupId));
    }

    public void checkMember(Long groupId) throws AccessDeniedException {
        User me = currentUser();
        Group group = findById(groupId);
        boolean isMember = group.getOwnerUserId().equals(me.getId())
                || groupMemberRepository.existsByGroupIdAndUserId(groupId, me.getId());
        if (!isMember) {
            throw new AccessDeniedException("このグループへのアクセス権がありません");
        }
    }

    public void checkOwner(Long groupId) throws AccessDeniedException {
        User me = currentUser();
        Group group = findById(groupId);
        if (!group.getOwnerUserId().equals(me.getId())) {
            throw new AccessDeniedException("この操作を行う権限がありません");
        }
    }

    @Transactional
    public void deleteGroup(Long groupId) throws AccessDeniedException {
        checkOwner(groupId);
        List<TaskList> groupLists = taskListRepository.findByGroupId(groupId);
        groupLists.forEach(l -> taskRepository.deleteByTaskListId(l.getId()));
        taskListRepository.deleteAll(groupLists);
        groupMemberRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    @Transactional
    public GroupMemberResponse inviteMember(Long groupId, InviteMemberRequest req)
            throws AccessDeniedException {
        checkOwner(groupId);

        User target = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new EntityNotFoundException("該当するユーザーが見つかりません"));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, target.getId())) {
            throw new IllegalStateException("このユーザーは既にメンバーです");
        }

        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(target.getId());
        member.setJoinedAt(LocalDateTime.now());
        GroupMember saved = groupMemberRepository.save(member);

        return toMemberResponse(saved, target);
    }

    public List<GroupMemberResponse> findMembers(Long groupId) throws AccessDeniedException {
        checkMember(groupId);
        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(m -> {
                    User u = userRepository.findById(m.getUserId())
                            .orElseThrow();
                    return toMemberResponse(m, u);
                })
                .toList();
    }

    private GroupMemberResponse toMemberResponse(GroupMember m, User u) {
        return new GroupMemberResponse(
                m.getId(),
                m.getGroupId(),
                u.getId(),
                u.getEmail(),
                u.getNickname(),
                m.getJoinedAt()
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("ユーザーが見つかりません: " + email));
    }
}
