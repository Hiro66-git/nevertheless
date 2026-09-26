import unittest
import tempfile
from pathlib import Path
from leafcode.agent.core import LeafAgent
from leafcode.agent.session import SessionManager
from leafcode.agent.context import ContextManager

class TestAgent(unittest.TestCase):
    def test_context_manager_system_prompt(self):
        cm = ContextManager()
        sys_msg = cm.build_system_message()
        self.assertEqual(sys_msg["role"], "system")
        self.assertIn("LeafCode", sys_msg["content"])

    def test_context_compaction(self):
        cm = ContextManager()
        messages = [{"role": "system", "content": "system"}] + [
            {"role": "user", "content": f"msg {i}"} for i in range(50)
        ]
        compacted = cm.compact_history(messages, max_messages=10)
        self.assertEqual(len(compacted), 10)
        self.assertEqual(compacted[0]["role"], "system")

    def test_session_manager_persistence(self):
        sess = SessionManager()
        sess.add_message("user", "Hello botanical assistant")
        sess.add_message("assistant", "Greetings developer! 🍃")
        
        self.assertEqual(len(sess.messages), 2)
        
        # Test markdown export
        md = sess.export_markdown()
        self.assertIn("Hello botanical assistant", md)
        self.assertIn("Greetings developer! 🍃", md)

    def test_agent_turn_mock_provider(self):
        sess = SessionManager()
        agent = LeafAgent(session=sess)
        
        response = agent.run_turn("Explain what LeafCode is")
        self.assertTrue(len(response) > 0)
        self.assertTrue(len(sess.messages) >= 2)

if __name__ == "__main__":
    unittest.main()
