import { useQuery } from '@tanstack/react-query';
import { okunmamisMesaj } from '@/data/repo';

/**
 * Menüdeki okunmamış mesaj rozeti.
 *
 * Dört kabuk da aynı sorguyu kullanıyor; TanStack aynı anahtarı paylaştığı
 * için ekstra istek çıkmıyor.
 */
export function useOkunmamis(): number {
  const sorgu = useQuery({
    queryKey: ['okunmamis-mesaj'],
    queryFn: okunmamisMesaj,
    refetchInterval: 30000,
  });
  return sorgu.data ?? 0;
}
