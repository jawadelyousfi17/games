interface Skill {
  id: number;
  name: string;
  level: number;
  // Add other skill properties as needed
}

interface UserImage {
  link: string;
  versions: {
    large: string;
    medium: string;
    small: string;
    micro: string;
  };
}

interface User {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  usual_first_name: string;
  url: string;
  phone: string;
  displayname: string;
  kind: string;
  image: UserImage;
  'staff?': boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location: string | null;
  wallet: number;
  anonymize_date: string;
  data_erasure_date: string;
  created_at: string;
  updated_at: string;
  alumnized_at: string | null;
  'alumni?': boolean;
  'active?': boolean;
}

interface Cursus {
  id: number;
  created_at: string;
  name: string;
  slug: string;
  kind: string;
}

interface CursusUser {
  id: number;
  begin_at: string;
  end_at: string | null;
  grade: string;
  level: number;
  skills: Skill[];
  cursus_id: number;
  has_coalition: boolean;
  blackholed_at: string | null;
  created_at: string;
  updated_at: string;
  user: User;
  cursus: Cursus;
}

export type { CursusUser, User, Cursus, Skill, UserImage };