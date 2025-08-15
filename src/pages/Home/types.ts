export interface DiscourseLatestPostsAPI {
  latest_posts: LatestPost[]
}

export interface DiscourseCategoryAPI {
  category_list: CategoryList
}

export interface CategoryList {
  can_create_category: boolean
  can_create_topic: boolean
  categories: Category[]
}

export interface Category {
  id: number
  name: string
  color: string
  text_color: string
  slug: string
  topic_count: number
  post_count: number
  position: number
  description?: string
  description_text?: string
  description_excerpt?: string
  topic_url: string
  read_restricted: boolean
  permission: number
  notification_level: number
  can_edit: boolean
  topic_template: string
  has_children: boolean
  subcategory_count: number
  sort_order: string
  sort_ascending: any
  show_subcategory_list: boolean
  num_featured_topics: number
  default_view: string
  subcategory_list_style: string
  default_top_period: string
  default_list_filter: string
  minimum_required_tags: number
  navigate_to_first_post_after_read: boolean
  custom_fields: CustomFields
  topics_day: number
  topics_week: number
  topics_month: number
  topics_year: number
  topics_all_time: number
  subcategory_ids: number[]
  sort_topics_by_event_start_date: any
  disable_topic_resorting: any
  uploaded_logo: UploadedLogo
  uploaded_logo_dark: any
  uploaded_background: any
  uploaded_background_dark: any
  topics: Topic[]
}

export interface CustomFields {
  has_chat_enabled: any
  enable_unassigned_filter: any
  sort_topics_by_event_start_date: any
  disable_topic_resorting: any
  create_topic_wizard: any
  enable_accepted_answers: any
}

export interface UploadedLogo {
  id: number
  url: string
  width: number
  height: number
}

export interface Topic {
  id: number
  title: string
  fancy_title: string
  slug: string
  posts_count: number
  reply_count: number
  highest_post_number: number
  image_url?: string
  created_at: string
  last_posted_at: string
  bumped: boolean
  bumped_at: string
  archetype: string
  unseen: boolean
  pinned: boolean
  unpinned: any
  excerpt: string
  visible: boolean
  closed: boolean
  archived: boolean
  bookmarked: any
  liked: any
  has_accepted_answer: boolean
  last_poster: LastPoster
}

export interface LastPoster {
  id: number
  username: string
  name?: string
  avatar_template: string
  animated_avatar: any
}

export interface LatestPost {
  id: number
  name?: string
  username: string
  avatar_template: string
  created_at: string
  cooked: string
  post_number: number
  post_type: number
  posts_count: number
  updated_at: string
  reply_count: number
  reply_to_post_number?: number
  quote_count: number
  incoming_link_count: number
  reads: number
  readers_count: number
  score: number
  yours: boolean
  topic_id: number
  topic_slug: string
  topic_title: string
  topic_html_title: string
  category_id: number
  display_username?: string
  primary_group_name?: string
  flair_name?: string
  flair_url?: string
  flair_bg_color?: string
  flair_color?: string
  flair_group_id?: number
  badges_granted: any[]
  version: number
  can_edit: boolean
  can_delete: boolean
  can_recover: boolean
  can_see_hidden_post: boolean
  can_wiki: boolean
  user_title?: string
  bookmarked: boolean
  raw: string
  actions_summary: ActionsSummary[]
  moderator: boolean
  admin: boolean
  staff: boolean
  user_id: number
  hidden: boolean
  trust_level: number
  deleted_at: any
  user_deleted: boolean
  edit_reason: any
  can_view_edit_history: boolean
  wiki: boolean
  excerpt: string
  truncated: boolean
  reviewable_id?: number
  reviewable_score_count: number
  reviewable_score_pending_count: number
  post_url: string
  animated_avatar: any
  user_cakedate: string
  event: any
  user_signature: any
  ratings: any[]
  reactions: Reaction[]
  current_user_reaction: any
  reaction_users_count: number
  current_user_used_main_reaction: boolean
  can_accept_answer: boolean
  can_unaccept_answer: boolean
  accepted_answer: boolean
  topic_accepted_answer: boolean
  notice?: Notice
  calendar_details?: any[]
  can_vote?: boolean
  title_is_group?: boolean
  user_birthdate?: string
  reply_to_user?: ReplyToUser
}

export interface ActionsSummary {
  id: number
  can_act: boolean
  count?: number
}

export interface Reaction {
  id: string
  type: string
  count: number
}

export interface Notice {
  type: string
  last_posted_at?: string
}

export interface ReplyToUser {
  username: string
  name: string
  avatar_template: string
}
