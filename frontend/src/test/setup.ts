import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import 'fake-indexeddb/auto'

configure({ asyncUtilTimeout: 3000 })
