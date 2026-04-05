export default function MemberGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a route group layout - it doesn't add any UI
  // The actual member layout is in (member)/member/layout.tsx
  return <>{children}</>;
}
