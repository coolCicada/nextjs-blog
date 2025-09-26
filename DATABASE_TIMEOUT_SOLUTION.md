# 数据库超时问题解决方案

## 🚨 问题描述
用户遇到数据库连接超时错误：
```
Error fetching rooms: Error: read ETIMEDOUT
errno: -60, code: 'ETIMEDOUT', syscall: 'read'
```

## 🔍 问题分析
1. **网络延迟**: 数据库连接时间较长（2秒+）
2. **缺少重试机制**: 单次失败就放弃
3. **连接池未优化**: 使用默认配置
4. **错误处理不完善**: 前端体验差

## ✅ 解决方案

### 1. 优化数据库连接配置
**文件**: `src/app/db/index.ts`
```typescript
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 20,                      // 最大连接数
  idle_timeout: 20,             // 空闲连接超时（秒）
  connect_timeout: 30,          // 连接超时（秒）
  transform: { undefined: null },
  connection: {
    application_name: 'nextjs-interview-app',
    statement_timeout: 30000,   // SQL语句超时（毫秒）
    query_timeout: 25000,       // 查询超时（毫秒）
  }
});
```

### 2. 添加重试机制
**文件**: `src/app/db/interview.ts`
```typescript
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      
      // 指数退避策略
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};
```

### 3. 改进API错误处理
**文件**: `src/app/api/interview/rooms/route.ts`
```typescript
export async function GET(request: NextRequest) {
  try {
    const rooms = await InterviewDB.getRoomsByUser(userId);
    return NextResponse.json({ rooms, success: true });
  } catch (error: any) {
    // 针对超时错误返回特殊状态码
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: '网络连接超时，请稍后重试',
        rooms: [],
        timeout: true
      }, { status: 503 }); // Service Unavailable
    }
    // ...其他错误处理
  }
}
```

### 4. 前端重试和用户体验优化
**文件**: `src/app/interview/page.tsx`
```typescript
const loadRooms = async (userId: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`/api/interview/rooms?userId=${userId}`);
      
      if (response.ok) {
        // 成功处理
        setRooms(data.rooms || []);
        setNetworkError(null);
        return;
      } else if (response.status === 503) {
        // 服务不可用，等待后重试
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
      }
    } catch (error) {
      // 网络错误处理
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }
  
  // 所有重试失败，显示友好错误信息
  setNetworkError('网络连接不稳定，请手动刷新');
  setRooms([]);
};
```

### 5. 添加用户界面反馈
- ✅ 网络状态指示器
- ✅ 重试按钮
- ✅ 加载动画
- ✅ 友好的错误提示

## 🛠 诊断工具
创建了 `db-diagnostics.mjs` 脚本用于：
- 测试数据库连接
- 检查查询性能
- 验证连接池状态
- 提供优化建议

## 📊 效果验证
1. **连接稳定性**: 支持自动重试机制
2. **用户体验**: 提供清晰的状态反馈
3. **错误恢复**: 支持手动刷新重试
4. **性能监控**: 可通过诊断脚本监控

## 🎯 最佳实践总结
1. **配置超时时间**: 根据网络环境调整
2. **实现重试机制**: 指数退避策略
3. **优雅降级**: 失败时显示空列表而不是错误页面
4. **用户反馈**: 清晰的加载和错误状态
5. **监控工具**: 定期检查数据库健康状态

## 🔧 故障排除指南
- `ETIMEDOUT`: 网络超时 → 检查网络连接，增加重试
- `ECONNREFUSED`: 连接拒绝 → 检查数据库服务状态
- `ENOTFOUND`: 域名解析失败 → 检查DNS配置
- 查询缓慢: 添加数据库索引，优化查询语句

现在系统具备了更强的网络容错能力和更好的用户体验！