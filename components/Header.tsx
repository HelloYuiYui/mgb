interface HeaderProps {
  title: string;
  subtitle?: string;
}

/** Reusable page header with a title and optional subtitle. */
export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-base text-gray-600">{subtitle}</p>
      )}
    </header>
  );
}
