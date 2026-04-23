import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signIn, useSessionStore } from '@/entities/session';
import { HttpError } from '@/shared/api/http';
import { Button, Input, Modal } from '@/shared/ui';

const routeApi = getRouteApi('/sign-in');

const schema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
  password: z
    .string()
    .regex(/^[A-Za-z0-9]{8,24}$/, '영문·숫자 8–24자로 입력해주세요.'),
});

type SignInForm = z.infer<typeof schema>;

export function SignInPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = routeApi.useSearch();
  const setAccessToken = useSessionStore((state) => state.setAccessToken);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: (tokens) => {
      setAccessToken(tokens.accessToken);
      void navigate({ to: redirectTo ?? '/' });
    },
    onError: (error) => {
      if (error instanceof HttpError) {
        const body = error.body as { errorMessage?: string } | null;
        setErrorMessage(body?.errorMessage ?? '로그인에 실패했습니다.');
        return;
      }
      setErrorMessage('로그인에 실패했습니다.');
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  const submitDisabled = !isValid || mutation.isPending;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6 font-sans">
      <h1 className="text-xl font-semibold text-text-primary">로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="영문·숫자 8–24자"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" disabled={submitDisabled}>
          {mutation.isPending ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <Modal.Root
        open={errorMessage !== null}
        onOpenChange={(open) => {
          if (!open) setErrorMessage(null);
        }}
      >
        <Modal.Content>
          <Modal.Title>로그인 실패</Modal.Title>
          <Modal.Description>{errorMessage}</Modal.Description>
          <Modal.Footer>
            <Modal.Close asChild>
              <Button variant="ghost">닫기</Button>
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </main>
  );
}
