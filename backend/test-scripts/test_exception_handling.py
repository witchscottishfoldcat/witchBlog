"""
异常处理机制测试脚本
验证异常处理系统是否正常工作
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """测试所有模块是否可以正常导入"""
    print("测试模块导入...")
    
    try:
        # 测试自定义异常
        from app.core.exceptions import (
            CustomException,
            NotFoundException,
            BadRequestException,
            DatabaseException,
            ExternalServiceException
        )
        print("✓ 自定义异常模块导入成功")
        
        # 测试数据库异常处理
        from app.core.database_exceptions import (
            transaction_scope,
            DatabaseErrorClassifier,
            DatabaseOperationHelper
        )
        print("✓ 数据库异常处理模块导入成功")
        
        # 测试结构化日志
        from app.core.unified_logging import (
            UnifiedLogger as StructuredLogger,
            get_logger,
            set_request_id,
            set_user_id
        )
        print("✓ 结构化日志模块导入成功")
        
        # 测试API响应
        from app.core.api_response import (
            ResponseBuilder,
            ErrorCodes,
            SuccessResponse
        )
        print("✓ API响应模块导入成功")
        
        # 测试全局异常处理器
        from app.core.global_exceptions import (
            register_exception_handlers,
            custom_exception_handler
        )
        print("✓ 全局异常处理器模块导入成功")
        
        # 测试请求上下文中间件
        from app.middleware.request_context import (
            RequestContextMiddleware
        )
        print("✓ 请求上下文中间件模块导入成功")
        
        return True
        
    except ImportError as e:
        print(f"✗ 模块导入失败: {e}")
        return False


def test_basic_functionality():
    """测试基本功能"""
    print("\n测试基本功能...")
    
    try:
        # 测试异常创建
        from app.core.exceptions import NotFoundException
        error = NotFoundException(
            message="测试资源未找到",
            details={"resource_id": 123}
        )
        print(f"✓ 自定义异常创建成功: {error.message}")
        
        # 测试日志记录
        from app.core.unified_logging import get_logger, set_request_id
        set_request_id("test-request-123")
        logger = get_logger("test")
        logger.info("测试日志记录")
        print("✓ 结构化日志记录成功")
        
        # 测试响应构建
        from app.core.api_response import ResponseBuilder
        response = ResponseBuilder.success(
            data={"test": "data"},
            message="测试成功响应"
        )
        print(f"✓ API响应构建成功: {response['success']}")
        
        return True
        
    except Exception as e:
        print(f"✗ 基本功能测试失败: {e}")
        return False


def test_database_components():
    """测试数据库组件"""
    print("\n测试数据库组件...")
    
    try:
        from app.core.database_exceptions import DatabaseErrorClassifier
        
        # 模拟数据库异常
        from sqlalchemy.exc import IntegrityError
        mock_error = Exception("Mock database error")
        
        # 测试错误分类
        classified_error = DatabaseErrorClassifier.classify_error(mock_error)
        print(f"✓ 数据库错误分类成功: {classified_error.__class__.__name__}")
        
        return True
        
    except Exception as e:
        print(f"✗ 数据库组件测试失败: {e}")
        return False



def main():
    """主测试函数"""
    print("=== 异常处理机制测试 ===")
    
    tests = [
        test_imports,
        test_basic_functionality,
        test_database_components
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n=== 测试结果 ===")
    print(f"通过: {passed}/{total}")
    
    if passed == total:
        print("✓ 所有测试通过，异常处理机制工作正常！")
        return 0
    else:
        print("✗ 部分测试失败，请检查错误信息")
        return 1


if __name__ == "__main__":
    sys.exit(main())