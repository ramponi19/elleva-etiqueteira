export type { Database } from "./database";

export type Profile = import("./database").Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = import("./database").Database["public"]["Tables"]["organizations"]["Row"];
export type LabelTemplate = import("./database").Database["public"]["Tables"]["label_templates"]["Row"];
export type Printer = import("./database").Database["public"]["Tables"]["printers"]["Row"];
export type PrintJob = import("./database").Database["public"]["Tables"]["print_jobs"]["Row"];
