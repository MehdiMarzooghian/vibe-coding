import { notFound } from "next/navigation";
import { DocumentDetailView } from "@/components/document-detail";
import { getDocumentDetail } from "@/lib/data";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const document = await getDocumentDetail("sale", id); if (!document) notFound();
  return <DocumentDetailView document={document} />;
}
