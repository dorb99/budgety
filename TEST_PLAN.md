# Budgety Test Plan

This document outlines the testing checklist for Budgety's core functionality.

## Authentication Tests

### ✅ Login Functionality
- [ ] **Test 1**: Login with Owner + correct 6-digit code → Should redirect to dashboard
- [ ] **Test 2**: Login with Partner + correct 6-digit code → Should redirect to dashboard  
- [ ] **Test 3**: Login with incorrect 6-digit code → Should show error message
- [ ] **Test 4**: Login with empty code → Should show validation error
- [ ] **Test 5**: Multiple failed attempts → Should trigger rate limiting (5 attempts per minute)

### ✅ Session Management
- [ ] **Test 6**: Successful login sets HTTP-only cookie
- [ ] **Test 7**: Browser refresh maintains session
- [ ] **Test 8**: Logout clears session and redirects to login
- [ ] **Test 9**: Direct access to protected routes without login → Redirects to login

## Transaction Management Tests

### ✅ Add Transaction (Home Page)
- [ ] **Test 10**: Add transaction with existing category → Success message, form resets
- [ ] **Test 11**: Add transaction with new category → Category auto-created, transaction saved
- [ ] **Test 12**: Add transaction with invalid amount (0, negative) → Validation error
- [ ] **Test 13**: Add transaction without category → Validation error
- [ ] **Test 14**: Add transaction with note → Note saved correctly
- [ ] **Test 15**: Add transaction with custom date → Date saved correctly
- [ ] **Test 16**: Payer field auto-populated with current user

### ✅ Category Management
- [ ] **Test 17**: Create category with duplicate name (case-insensitive) → Error message
- [ ] **Test 18**: Create category with empty name → Validation error
- [ ] **Test 19**: Categories appear in dropdown after creation

## Budget Management Tests

### ✅ Budgets Page
- [ ] **Test 20**: Default month shows current month (Asia/Jerusalem timezone)
- [ ] **Test 21**: Month selector changes displayed data
- [ ] **Test 22**: "Left" column shows negative values in red when over budget
- [ ] **Test 23**: Effective budget calculation: override > default > 0

### ✅ Budget Editing
- [ ] **Test 24**: Edit default budget → Updates category.defaultBudgetAmount
- [ ] **Test 25**: Edit monthly budget → Creates/updates budget_override
- [ ] **Test 26**: Monthly override shows "(override)" indicator
- [ ] **Test 27**: Cancel editing → Reverts to original value
- [ ] **Test 28**: Save with invalid amount (negative) → Error message

### ✅ Spending Calculations
- [ ] **Test 29**: "Spent" column shows sum of transactions for selected month
- [ ] **Test 30**: "Left" calculation: effectiveBudget - spent
- [ ] **Test 31**: Categories with no transactions show 0 spent

## Summary Page Tests

### ✅ Filters
- [ ] **Test 32**: "This Month" filter shows current month data
- [ ] **Test 33**: "Last Month" filter shows previous month data
- [ ] **Test 34**: "Custom Range" filter shows data between selected dates
- [ ] **Test 35**: Category filter (multiple selection) → Shows only selected categories
- [ ] **Test 36**: Payer filter → Shows only selected payer's transactions

### ✅ Summary Data
- [ ] **Test 37**: Total spending matches sum of all filtered transactions
- [ ] **Test 38**: Spending by category shows correct amounts and percentages
- [ ] **Test 39**: Spending by payer shows correct totals
- [ ] **Test 40**: Transaction count matches filtered results

### ✅ CSV Export
- [ ] **Test 41**: CSV export includes only filtered transactions
- [ ] **Test 42**: CSV includes all required fields: date, category, amount, payer, note
- [ ] **Test 43**: CSV file downloads successfully

### ✅ Transaction Management
- [ ] **Test 44**: Delete own transaction → Transaction removed, summary updates
- [ ] **Test 45**: Owner deletes Partner's transaction → Success
- [ ] **Test 46**: Partner tries to delete Owner's transaction → Permission denied

## UI/UX Tests

### ✅ Responsive Design
- [ ] **Test 47**: Mobile view (320px width) → All elements visible and usable
- [ ] **Test 48**: Tablet view (768px width) → Layout adapts correctly
- [ ] **Test 49**: Desktop view (1024px+ width) → Full layout displayed

### ✅ Navigation
- [ ] **Test 50**: Navigation between pages works correctly
- [ ] **Test 51**: Active page highlighted in navigation
- [ ] **Test 52**: User name displayed in header
- [ ] **Test 53**: Logout button works from any page

### ✅ Form Validation
- [ ] **Test 54**: Required fields show validation errors
- [ ] **Test 55**: Number inputs accept only valid numbers
- [ ] **Test 56**: Date inputs accept only valid dates
- [ ] **Test 57**: Form submission disabled when validation fails

## Data Integrity Tests

### ✅ Timezone Handling
- [ ] **Test 58**: All dates stored and displayed in Asia/Jerusalem timezone
- [ ] **Test 59**: Month boundaries calculated correctly for local timezone
- [ ] **Test 60**: Date picker shows correct local dates

### ✅ Currency Formatting
- [ ] **Test 61**: All amounts displayed in ILS format (₪)
- [ ] **Test 62**: Decimal places handled correctly (2 decimal places)
- [ ] **Test 63**: Large numbers formatted with thousands separators

## Performance Tests

### ✅ Loading States
- [ ] **Test 64**: Loading indicators shown during API calls
- [ ] **Test 65**: Forms disabled during submission
- [ ] **Test 66**: No infinite loading states

### ✅ Error Handling
- [ ] **Test 67**: Network errors show user-friendly messages
- [ ] **Test 68**: Server errors (500) handled gracefully
- [ ] **Test 69**: Invalid API responses don't crash the app

## Security Tests

### ✅ Input Validation
- [ ] **Test 70**: XSS prevention in user inputs
- [ ] **Test 71**: SQL injection prevention (handled by Prisma)
- [ ] **Test 72**: CSRF protection via same-origin policy

### ✅ Authentication Security
- [ ] **Test 73**: Session cookies are HTTP-only
- [ ] **Test 74**: Session cookies are secure in production
- [ ] **Test 75**: Rate limiting prevents brute force attacks

## Browser Compatibility

### ✅ Modern Browsers
- [ ] **Test 76**: Chrome (latest) → All features work
- [ ] **Test 77**: Firefox (latest) → All features work
- [ ] **Test 78**: Safari (latest) → All features work
- [ ] **Test 79**: Edge (latest) → All features work

---

## Test Execution Notes

1. **Environment Setup**: Ensure test database is seeded with sample data
2. **Test Data**: Create test categories and transactions for comprehensive testing
3. **Timezone**: Run tests from Asia/Jerusalem timezone or adjust expectations
4. **Browser DevTools**: Use for responsive design testing and network monitoring
5. **Error Scenarios**: Test with network throttling and offline mode

## Acceptance Criteria Summary

✅ **All tests must pass** for the following core requirements:

1. **Authentication**: 6-digit code login for Owner/Partner with session management
2. **Transaction Management**: Add transactions with categories, validation, and permissions
3. **Budget Management**: Default/override budgets with correct calculations
4. **Summary & Export**: Filtered views with CSV export functionality
5. **Responsive Design**: Mobile-first UI that works on all devices
6. **Data Integrity**: Correct timezone handling and currency formatting
