import { CATEGORY_NAME_MAX_LENGTH } from "@/constants/categories";
import { MESSAGES } from "@/constants/messages";
import { withTopicParticle } from "@/utils/korean";

/**
 * The message for a category name, or undefined when it is valid. `label` is what the user is naming, e.g.
 * "중분류 이름". Required (the API's own rule) and at most 50 characters, counted as the user sees them.
 */
export function categoryNameError(name: string, label: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return MESSAGES.required(label);
  if ([...trimmed].length > CATEGORY_NAME_MAX_LENGTH) {
    return `${withTopicParticle(label)} ${CATEGORY_NAME_MAX_LENGTH}자 이내로 입력해 주세요.`;
  }
  return undefined;
}
