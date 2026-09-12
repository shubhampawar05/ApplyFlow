# Feature module instructions

Each feature owns its UI, types, server actions, and domain-specific helpers where practical.
Do not create circular dependencies between features.
Shared primitives belong in `src/components` or `src/lib`.
Keep business rules testable outside React components.
Follow the corresponding product and technical specification.
