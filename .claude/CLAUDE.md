export interface ValidationContext {
  isValid: boolean;
  isExpired?: boolean;
  timestamp?: number;
}

export function validateAndProcess(item?: ValidationContext | null): boolean {
  if (!item || typeof item !== 'object') {
    return false;
  }
  if (!item.isValid || item.isExpired) {
    return false;
  }
  return true;
}d to understand, not edit.
- `verify_done` - call once BEFORE declaring a multi-file task complete:
  returns mechanically broken references (imports of removed names, parse
  errors) and untouched dependents of the files you changed, with file:line.
- vexp may append a one-line hint to a prompt when orientation would help;
  otherwise it stays silent.

### Query shape (do this)
Anchor the task on real identifiers (ClassName, functionName) or file paths:
`run_pipeline({ "task": "fix JWT expiry in AuthService.validateToken" })`
<!-- /vexp -->