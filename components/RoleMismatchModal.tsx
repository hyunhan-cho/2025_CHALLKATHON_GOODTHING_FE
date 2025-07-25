// components/RoleMismatchModal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button'; // shadcn/ui Button 컴포넌트 사용

interface RoleMismatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    actionText?: string;
    onActionClick?: () => void;
}

export default function RoleMismatchModal({
    isOpen,
    onClose,
    message,
    actionText,
    onActionClick,
}: RoleMismatchModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl text-center space-y-4 shadow-lg max-w-sm w-full">
                <p className="text-lg font-bold text-gray-800">{message}</p>
                <div className="flex flex-col space-y-2">
                    {actionText && onActionClick && (
                        <Button
                            onClick={() => {
                                onActionClick();
                                onClose(); // 액션 실행 후 모달 닫기
                            }}
                            className="bg-brand-navy hover:bg-brand-navy-light text-white px-4 py-2 rounded-lg text-base"
                        >
                            {actionText}
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-base"
                    >
                        닫기
                    </Button>
                </div>
            </div>
        </div>
    );
}
