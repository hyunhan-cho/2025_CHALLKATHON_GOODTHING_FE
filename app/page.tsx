import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-20rem)] py-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-navy mb-6">
                <span className="block">KBO 야구 관람,</span>
                <span className="block mt-2 sm:mt-3">
                    이제 <span className="text-brand-sky">같이가요</span>와 함께!
                </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto mb-12">
                온라인 티켓 예매가 어려우신 시니어 팬분들을 위해, 디지털에 능숙한 헬퍼가 예매부터 경기장 동행까지
                도와드립니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-md md:max-w-2xl">
                <Link href="/login?role=senior" passHref>
                    <Button
                        variant="default"
                        className="w-full btn-touch-xl bg-brand-navy hover:bg-brand-navy-light text-white flex items-center justify-center gap-3"
                    >
                        <span>경기 보러가고 싶어요</span>
                        <ArrowRight size={28} />
                    </Button>
                </Link>
                <Link href="/login?role=helper" passHref>
                    <Button
                        variant="outline"
                        className="w-full btn-touch-xl border-brand-navy text-brand-navy hover:bg-brand-sky/30 hover:text-brand-navy bg-white flex items-center justify-center gap-3"
                    >
                        <span>도움 드리고 싶어요</span>
                        <ArrowRight size={28} />
                    </Button>
                </Link>
            </div>
            <p className="mt-12 text-lg text-gray-600">버튼을 눌러 시작해보세요!</p>
        </div>
    );
}
