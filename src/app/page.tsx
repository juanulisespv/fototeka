
'use client';

import ClientPage from "@/components/client-page";
import withAuth from "@/hoc/withAuth";

function HomePage() {
  return <ClientPage />;
}

export default withAuth(HomePage);
