import { SwaggerUIWrapper } from "./_ui/swagger-ui-wrapper";

export const metadata = { title: "Hanaloop PCF API Docs" };

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerUIWrapper />
    </main>
  );
}
