/**
 * 消息类型定义
 * 基于 messages/zh.json 和 messages/en.json 的结构
 * 确保类型安全和代码提示
 */

export type Messages = typeof import('../messages/zh.json');

// 消息命名空间类型
export type NavMessages = Messages['nav'];
export type CommonMessages = Messages['common'];
export type BlogMessages = Messages['blog'];
export type SidebarMessages = Messages['sidebar'];
export type ArchiveMessages = Messages['archive'];
export type MyPageMessages = Messages['myPage'];
export type PostsMessages = Messages['posts'];
export type SearchMessages = Messages['search'];
export type DiaryMessages = Messages['diary'];
export type GalleryMessages = Messages['gallery'];
export type AboutMessages = Messages['about'];
export type FriendLinksMessages = Messages['friendLinks'];
export type ProjectsMessages = Messages['projects'];
export type SkillsMessages = Messages['skills'];
export type TimelineMessages = Messages['timeline'];
export type ComponentsMessages = Messages['components'];
export type DashboardMessages = Messages['dashboard'];

// 命名空间键类型
export type MessageNamespace = keyof Messages;

// 获取命名空间消息类型的辅助类型
export type NamespaceMessages<T extends MessageNamespace> = Messages[T];

