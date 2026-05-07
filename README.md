# Hanaloop Monorepo

Turborepo + pnpm 기반 모노레포입니다.

## 구조

- `apps/client`: React 프론트엔드
- `apps/server`: Nest 백엔드

## 공통 설정

- 루트 `tsconfig.base.json`를 공통 TypeScript 설정으로 사용
- 각 앱의 `tsconfig.json`에서 `extends`로 상속해서 사용

## 명령어

```sh
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```
