# Group Chat Feature Usage

## Overview
The group chat feature allows users to create groups, add/remove members, and send messages in group conversations. Only admin users can create groups and manage members.

## Database Structure
The group chat uses the following tables:
- `groups` - Stores group information
- `group_members` - Stores group membership data
- `messages` - Stores both direct and group messages
- `group_message_status` - Tracks read/unread status for group messages

## Components

### 1. GroupChat Component (`groupchat.tsx`)
Main component for group chat interface with features:
- Send/receive group messages
- Edit/delete messages (own messages only)
- Add/remove members (admin only)
- View group info and member list
- Real-time message updates

### 2. ChatSidebar Component (`chat.tsx`)
Updated to include:
- Tab navigation between Users and Groups
- Group list with unread message counts
- Create group modal (admin only)
- Search functionality for both users and groups

### 3. Database Functions (`chatlib/supabasefunc.ts`)
Group-related functions:
- `getUserGroups(userId)` - Get user's groups
- `createGroup(name, description, createdBy, memberIds)` - Create new group
- `sendGroupMessage(senderId, groupId, content)` - Send group message
- `getGroupUnseenMessageCount(userId, groupId)` - Get unread count
- `addGroupMember(groupId, userId)` - Add member to group
- `removeGroupMember(groupId, userId)` - Remove member from group

## Usage

### Opening Group Chat
1. Click the chat button to open chat sidebar
2. Switch to "Groups" tab
3. Click on any group to open group chat interface

### Creating a Group (Admin Only)
1. Go to Groups tab in chat sidebar
2. Click the "+" button or "Create Group" button
3. Fill in group name and description
4. Select members to add
5. Click "Create Group"

### Group Chat Features
- **Send Messages**: Type in the input field and press Enter or click Send
- **Edit Messages**: Hover over your message and click edit icon
- **Delete Messages**: Hover over your message and click delete icon
- **Add Members**: Click the user+ icon in header (admin only)
- **View Group Info**: Click the info icon in header
- **Minimize/Maximize**: Click the chevron icon in header

### Real-time Updates
- New messages appear instantly
- Message read status updates in real-time
- Member additions/removals update immediately
- Unread message counts update automatically

## Permissions
- **All Users**: Can view groups they're members of, send messages, edit/delete own messages
- **Group Admins**: Can add/remove members, manage group settings
- **System Admins**: Can create new groups, have admin privileges in all groups

## Integration with App.tsx
The group chat is integrated into the main app with:
- State management for group chat visibility
- Functions to open/close group chats
- Proper component rendering alongside person chat

## Styling
The group chat uses a dark theme with:
- Consistent styling with the existing person chat
- Beautiful gradients for group avatars
- Smooth animations and transitions
- Responsive design for different screen sizes