# Questions

<!-- GA-GENERATED:index -->

- [Should people be able to sign out of all their devices?](account-flows.md) - With Firebase Auth as the sign-in, "sign out of all devices" doesn't exist; it needs a decision before it can be built. Deleting an account is answered by anonymise-deleted-accounts.
- [Why is activity recorded in the notification routes?](activity-recording-location.md) - Activity rows are written by /api/push-notification routes the browser calls after each action, not by the actions. Is that intended?
- [Is more than one currency planned?](currency.md) - Every currency field defaults to inr and amounts are always shown with the rupee symbol. Should groups or expenses have their own currency?
- [Should editing an expense change more than its description?](expense-edit-scope.md) - updateExpense only changes the description; amounts, payers and splits can't be edited, only deleted and re-added.
- [Who may change a group, an expense or a contact?](group-permissions.md) - The code lets any signed-in person change anything. What should the rules be: any member, the creator, or an owner role?
- [How should changes be tested?](testing-approach.md) - The repository has no tests, test runner or CI; ga's workflow is test-first. Which tests should new work add, and with what?
- [Should 'You owe' show the net amount?](your-share-owe-amount.md) - On one expense, a person who paid part and owes more is told they owe their whole split, not the difference. Is that intended?

<!-- GA-GENERATED:END -->
