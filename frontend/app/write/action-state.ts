type WriteFieldName = "title" | "description" | "content";

export type WriteActionState = {
  errors: Partial<Record<WriteFieldName | "form", string>>;
};

export const initialWriteActionState: WriteActionState = {
  errors: {},
};
